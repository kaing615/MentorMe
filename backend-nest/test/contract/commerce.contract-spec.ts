import { getConnectionToken } from "@nestjs/mongoose";
import jwt from "jsonwebtoken";
import { createConnection, Types } from "mongoose";
import type { Connection } from "mongoose";
import { compareResponses } from "./parity";
import type { ParityRuntime } from "./parity-runtime";
import { startParityRuntime } from "./parity-runtime";

describe("Commerce contract parity", () => {
  let runtime: ParityRuntime;
  let token: string;
  let courseId: Types.ObjectId;
  const orderNumber = "ORDER-COMMERCE-PARITY";

  beforeAll(async () => {
    runtime = await startParityRuntime("commerce", 4204);
    const mentorId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    courseId = new Types.ObjectId();
    const now = new Date();
    const users = [
      {
        _id: mentorId,
        email: "commerce-parity-mentor@example.com",
        userName: "commerce_parity_mentor",
        firstName: "Commerce",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
        avatarUrl: "",
      },
      {
        _id: userId,
        email: "commerce-parity-user@example.com",
        userName: "commerce_parity_user",
        firstName: "Commerce",
        lastName: "User",
        role: "mentee",
        isVerified: true,
        avatarUrl: "",
      },
    ];
    const course = {
      _id: courseId,
      title: "Commerce parity course",
      description: "A course used to verify commerce read contracts.",
      price: 100000,
      thumbnail: "",
      mentor: mentorId,
      mentees: [],
      category: "Development",
      duration: 1,
      rate: 0,
      lectures: 2,
      link: "https://example.com/commerce-parity",
      createdAt: now,
      updatedAt: now,
    };
    const cart = {
      _id: new Types.ObjectId(),
      user: userId,
      courses: [{ _id: new Types.ObjectId(), course: courseId, addedAt: now }],
      totalPrice: 100000,
      discountCode: "",
      discountAmount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const order = {
      _id: new Types.ObjectId(),
      orderNumber,
      mentee: userId,
      userId,
      items: [
        {
          courseId,
          title: course.title,
          price: 100000,
          quantity: 1,
          thumbnail: "",
        },
      ],
      courses: [courseId],
      type: "course",
      subtotalAmount: 100000,
      discountCode: "",
      discountAmount: 0,
      amount: 100000,
      totalAmount: 100000,
      billingInfo: {
        email: users[1]!.email,
        firstName: "Commerce",
        lastName: "User",
        country: "Vietnam",
        address: "",
      },
      paymentInfo: {
        method: "vnpay",
        transactionId: "",
        paymentGateway: "manual",
        paymentData: {},
      },
      paymentMethod: "vnpay",
      status: "pending",
      coursesGranted: false,
      createdAt: now,
      updatedAt: now,
    };
    const legacy = await createConnection(runtime.legacyMongoUrl).asPromise();
    const nest = runtime.nestApp.get<Connection>(getConnectionToken());
    for (const connection of [legacy, nest]) {
      await connection.collection("users").insertMany(users);
      await connection.collection("courses").insertOne(course);
      await connection.collection("carts").insertOne(cart);
      await connection.collection("orders").insertOne(order);
    }
    await legacy.close();
    token = jwt.sign(
      { id: String(userId) },
      process.env.JWT_SECRET ?? "nest-test-secret-with-enough-length",
    );
  }, 20_000);

  afterAll(async () => runtime.stop());

  it("matches unauthenticated cart access", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/cart",
    });
  });

  it("matches cart read and check", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/cart",
      token,
    });
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/cart/check/${String(courseId)}`,
      token,
    });
  });

  it("matches order detail and payment status", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/orders/${orderNumber}`,
      token,
    });
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/payment/status/${orderNumber}`,
      token,
    });
  });

  it("matches invalid VNPay IPN protocol responses", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/payment/vnpay/ipn?vnp_TxnRef=${orderNumber}&vnp_SecureHash=invalid`,
    });
  });
});
