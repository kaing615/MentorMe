import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { User } from "../../src/identity/user.schema";
import { Availability } from "../../src/mentoring/availability.schema";
import { Booking } from "../../src/mentoring/booking.schema";
import { createApplication } from "../../src/main";

describe("booking transactions", () => {
  let app: INestApplication;
  let connection: Connection;
  let availabilities: Model<Availability>;
  let bookings: Model<Booking>;
  let mentorId: string;
  let menteeAId: string;
  let mentorToken: string;
  let menteeAToken: string;
  let menteeBToken: string;
  let outsiderToken: string;
  let date: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();

    const users = app.get<Model<User>>(getModelToken(User.name));
    availabilities = app.get<Model<Availability>>(
      getModelToken(Availability.name),
    );
    bookings = app.get<Model<Booking>>(getModelToken(Booking.name));
    const jwt = app.get(JwtService);
    const [mentor, menteeA, menteeB, outsider] = await users.create([
      {
        email: "booking-mentor@example.com",
        userName: "booking_mentor",
        firstName: "Booking",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "booking-mentee-a@example.com",
        userName: "booking_mentee_a",
        firstName: "Mentee",
        lastName: "A",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "booking-mentee-b@example.com",
        userName: "booking_mentee_b",
        firstName: "Mentee",
        lastName: "B",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "booking-outsider@example.com",
        userName: "booking_outsider",
        firstName: "Booking",
        lastName: "Outsider",
        role: "mentee",
        isVerified: true,
      },
    ]);

    mentorId = String(mentor!._id);
    menteeAId = String(menteeA!._id);
    mentorToken = await jwt.signAsync({ id: mentorId });
    menteeAToken = await jwt.signAsync({ id: menteeAId });
    menteeBToken = await jwt.signAsync({ id: String(menteeB!._id) });
    outsiderToken = await jwt.signAsync({ id: String(outsider!._id) });
    const bookingDate = new Date();
    bookingDate.setUTCDate(bookingDate.getUTCDate() + 7);
    date = bookingDate.toISOString().slice(0, 10);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  const addSlot = async (start: string, end: string): Promise<void> => {
    await availabilities.updateOne(
      { mentor: mentorId, date: new Date(`${date}T00:00:00.000Z`) },
      {
        $setOnInsert: { mentor: mentorId, date, timezone: "Asia/Ho_Chi_Minh" },
        $push: { slots: { start, end, status: "open" } },
      },
      { upsert: true },
    );
  };

  const reserve = async (
    token: string,
    start: string,
    end: string,
  ): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/booking/mentor/${mentorId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date, start, end })
      .expect(200);
    return response.body.data.booking._id as string;
  };

  it("lets only one concurrent request reserve an open slot", async () => {
    await addSlot("09:00", "09:30");

    const responses = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/booking/mentor/${mentorId}`)
        .set("Authorization", `Bearer ${menteeAToken}`)
        .send({ date, start: "09:00", end: "09:30" }),
      request(app.getHttpServer())
        .post(`/api/v1/booking/mentor/${mentorId}`)
        .set("Authorization", `Bearer ${menteeBToken}`)
        .send({ date, start: "09:00", end: "09:30" }),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(
      await bookings.countDocuments({
        mentor: mentorId,
        date: new Date(`${date}T00:00:00.000Z`),
        start: "09:00",
      }),
    ).toBe(1);
    const availability = await availabilities.findOne({ mentor: mentorId });
    expect(availability?.slots[0]?.status).toBe("held");
    const rawBooking = await connection.collection("bookings").findOne({});
    const rawRelationship = await connection
      .collection("relationships")
      .findOne({});
    expect(rawBooking?.mentor).toBeInstanceOf(Types.ObjectId);
    expect(rawBooking?.mentee).toBeInstanceOf(Types.ObjectId);
    expect(rawBooking?.relationship).toBeInstanceOf(Types.ObjectId);
    expect(rawRelationship?.mentor).toBeInstanceOf(Types.ObjectId);
    expect(rawRelationship?.mentee).toBeInstanceOf(Types.ObjectId);
    expect(availability?.slots[0]?.bookedBy).toBeInstanceOf(Types.ObjectId);
  });

  it("lets only the booking mentor confirm or decline", async () => {
    await addSlot("10:00", "10:30");
    const confirmedId = await reserve(menteeAToken, "10:00", "10:30");

    await request(app.getHttpServer())
      .post(`/api/v1/booking/confirm/${confirmedId}`)
      .set("Authorization", `Bearer ${menteeAToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/booking/confirm/${confirmedId}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/booking/confirm/${confirmedId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);

    await addSlot("10:30", "11:00");
    const declinedId = await reserve(menteeBToken, "10:30", "11:00");
    await request(app.getHttpServer())
      .post(`/api/v1/booking/decline/${declinedId}`)
      .set("Authorization", `Bearer ${menteeBToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/booking/decline/${declinedId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ reason: "Unavailable" })
      .expect(200);
  });

  it("lets booking participants cancel and rejects outsiders", async () => {
    await addSlot("11:00", "11:30");
    const menteeCancellationId = await reserve(
      menteeAToken,
      "11:00",
      "11:30",
    );
    await request(app.getHttpServer())
      .post(`/api/v1/booking/cancel/${menteeCancellationId}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/booking/cancel/${menteeCancellationId}`)
      .set("Authorization", `Bearer ${menteeAToken}`)
      .expect(200);

    await addSlot("11:30", "12:00");
    const mentorCancellationId = await reserve(
      menteeAToken,
      "11:30",
      "12:00",
    );
    await request(app.getHttpServer())
      .post(`/api/v1/booking/cancel/${mentorCancellationId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
  });
});
