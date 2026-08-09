import { getConnectionToken } from "@nestjs/mongoose";
import jwt from "jsonwebtoken";
import { createConnection, Types } from "mongoose";
import type { Connection } from "mongoose";
import { compareResponses } from "./parity";
import type { ParityRuntime } from "./parity-runtime";
import { startParityRuntime } from "./parity-runtime";

describe("Mentoring contract parity", () => {
  let runtime: ParityRuntime;
  let mentorToken: string;
  let mentorId: Types.ObjectId;
  let bookingId: Types.ObjectId;
  let date: string;

  beforeAll(async () => {
    runtime = await startParityRuntime("mentoring", 4202);
    mentorId = new Types.ObjectId();
    const menteeId = new Types.ObjectId();
    const relationshipId = new Types.ObjectId();
    const availabilityId = new Types.ObjectId();
    const slotId = new Types.ObjectId();
    bookingId = new Types.ObjectId();
    const reviewId = new Types.ObjectId();
    const targetDate = new Date();
    targetDate.setUTCDate(targetDate.getUTCDate() + 2);
    targetDate.setUTCHours(0, 0, 0, 0);
    date = targetDate.toISOString().slice(0, 10);
    const now = new Date();
    const users = [
      {
        _id: mentorId,
        email: "mentoring-parity-mentor@example.com",
        userName: "mentoring_parity_mentor",
        firstName: "Parity",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
        avatarUrl: "",
        jobTitle: "Engineer",
      },
      {
        _id: menteeId,
        email: "mentoring-parity-mentee@example.com",
        userName: "mentoring_parity_mentee",
        firstName: "Parity",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
        avatarUrl: "",
      },
    ];
    const availability = {
      _id: availabilityId,
      mentor: mentorId,
      date: targetDate,
      timezone: "Asia/Ho_Chi_Minh",
      slots: [{ _id: slotId, start: "09:00", end: "09:30", status: "booked" }],
      createdAt: now,
      updatedAt: now,
    };
    const relationship = {
      _id: relationshipId,
      mentor: mentorId,
      mentee: menteeId,
    };
    const booking = {
      _id: bookingId,
      relationship: relationshipId,
      mentor: mentorId,
      mentee: menteeId,
      status: "active",
      date: targetDate,
      start: "09:00",
      end: "09:30",
      notes: "Parity booking",
      slotId,
      availabilityId,
      createdAt: now,
    };
    const review = {
      _id: reviewId,
      author: menteeId,
      targetType: "Booking",
      target: bookingId,
      content: "Parity review",
      rate: 5,
      createdAt: now,
      updatedAt: now,
    };

    const legacy = await createConnection(runtime.legacyMongoUrl).asPromise();
    const nest = runtime.nestApp.get<Connection>(getConnectionToken());
    for (const connection of [legacy, nest]) {
      await connection.collection("users").insertMany(users);
      await connection.collection("availabilities").insertOne(availability);
      await connection.collection("relationships").insertOne(relationship);
      await connection.collection("bookings").insertOne(booking);
      await connection.collection("reviews").insertOne(review);
    }
    await legacy.close();
    mentorToken = jwt.sign(
      { id: String(mentorId) },
      process.env.JWT_SECRET ?? "nest-test-secret-with-enough-length",
    );
  }, 20_000);

  afterAll(async () => runtime.stop());

  it("matches unauthenticated mentoring access", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/availability/overview",
    });
  });

  it("matches mentor availability range responses", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/availability/mentor/range?startDate=${date}&endDate=${date}`,
      token: mentorToken,
    });
  });

  it("matches mentor booking list responses", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/booking/mentor?status=active",
      token: mentorToken,
    });
  });

  it("matches target review list responses", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/reviews?targetType=Booking&target=${String(bookingId)}`,
      token: mentorToken,
    });
  });
});
