import { getConnectionToken } from "@nestjs/mongoose";
import jwt from "jsonwebtoken";
import { createConnection, Types } from "mongoose";
import type { Connection } from "mongoose";
import { compareResponses } from "./parity";
import type { ParityRuntime } from "./parity-runtime";
import { startParityRuntime } from "./parity-runtime";

describe("Learning contract parity", () => {
  let runtime: ParityRuntime;
  let courseId: Types.ObjectId;
  let token: string;

  beforeAll(async () => {
    runtime = await startParityRuntime("learning", 4203);
    const mentorId = new Types.ObjectId();
    const menteeId = new Types.ObjectId();
    courseId = new Types.ObjectId();
    const orderId = new Types.ObjectId();
    const purchaseId = new Types.ObjectId();
    const now = new Date();
    const users = [
      {
        _id: mentorId,
        email: "learning-parity-mentor@example.com",
        userName: "learning_parity_mentor",
        firstName: "Learning",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
        avatarUrl: "",
        jobTitle: "Engineer",
      },
      {
        _id: menteeId,
        email: "learning-parity-mentee@example.com",
        userName: "learning_parity_mentee",
        firstName: "Learning",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
        avatarUrl: "",
      },
    ];
    const course = {
      _id: courseId,
      title: "Learning parity course",
      description: "A course used to verify the learning contract.",
      price: 50,
      thumbnail: "",
      thumbnailPublicId: "",
      mentor: mentorId,
      mentors: [],
      mentees: [menteeId],
      lessons: [],
      category: "Development",
      tags: ["TypeScript"],
      language: ["English"],
      level: "Intermediate",
      duration: 5,
      rate: 0,
      numberOfRatings: 0,
      link: "https://example.com/learning-parity",
      lectures: 10,
      createdAt: now,
      updatedAt: now,
    };
    const order = {
      _id: orderId,
      orderNumber: "ORDER-LEARNING-PARITY",
      mentee: menteeId,
      userId: menteeId,
      items: [{ courseId, title: course.title, price: 50, quantity: 1 }],
      subtotalAmount: 50,
      amount: 50,
      totalAmount: 50,
      paymentMethod: "vnpay",
      status: "paid",
      createdAt: now,
      updatedAt: now,
    };
    const purchase = {
      _id: purchaseId,
      mentee: menteeId,
      course: courseId,
      order: orderId,
      purchaseDate: now,
      price: 50,
      progress: 0,
      lastAccessDate: now,
      isCompleted: false,
      certificateIssued: false,
      rating: null,
      review: "",
      reviewDate: null,
      createdAt: now,
      updatedAt: now,
    };

    const legacy = await createConnection(runtime.legacyMongoUrl).asPromise();
    const nest = runtime.nestApp.get<Connection>(getConnectionToken());
    for (const connection of [legacy, nest]) {
      await connection.collection("users").insertMany(users);
      await connection.collection("courses").insertOne(course);
      await connection.collection("orders").insertOne(order);
      await connection.collection("purchasedcourses").insertOne(purchase);
    }
    await legacy.close();
    token = jwt.sign(
      { id: String(menteeId) },
      process.env.JWT_SECRET ?? "nest-test-secret-with-enough-length",
    );
  }, 20_000);

  afterAll(async () => runtime.stop());

  it("matches public course list", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/course?page=1&limit=10",
    });
  });

  it("matches course detail", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/course/${String(courseId)}`,
    });
  });

  it("matches purchase status", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/course/${String(courseId)}/purchase-status`,
      token,
    });
  });

  it("matches purchased-course list and check", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/purchased-courses",
      token,
    });
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/purchased-courses/check/${String(courseId)}`,
      token,
    });
  });
});
