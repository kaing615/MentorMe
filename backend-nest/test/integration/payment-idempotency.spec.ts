import crypto from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { Order } from "../../src/commerce/order.schema";
import { PaymentEvent } from "../../src/commerce/payment-event.schema";
import { User } from "../../src/identity/user.schema";
import { Course } from "../../src/learning/course.schema";
import { PurchasedCourse } from "../../src/learning/purchased-course.schema";
import { createApplication } from "../../src/main";

describe("payment callback idempotency", () => {
  let app: INestApplication;
  let connection: Connection;
  let orders: Model<Order>;
  let events: Model<PaymentEvent>;
  let courses: Model<Course>;
  let purchases: Model<PurchasedCourse>;
  let orderNumber: string;
  let courseId: string;
  let menteeId: string;
  let mentorId: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    orders = app.get<Model<Order>>(getModelToken(Order.name));
    events = app.get<Model<PaymentEvent>>(getModelToken(PaymentEvent.name));
    courses = app.get<Model<Course>>(getModelToken(Course.name));
    purchases = app.get<Model<PurchasedCourse>>(
      getModelToken(PurchasedCourse.name),
    );
    const users = app.get<Model<User>>(getModelToken(User.name));
    const [mentor, mentee] = await users.create([
      {
        email: "payment-mentor@example.com",
        userName: "payment_mentor",
        firstName: "Payment",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "payment-mentee@example.com",
        userName: "payment_mentee",
        firstName: "Payment",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
      },
    ]);
    mentorId = String(mentor!._id);
    menteeId = String(mentee!._id);
    const course = await courses.create({
      title: "Payment course",
      description: "A course purchased through a verified payment callback.",
      price: 250000,
      mentor: mentor!._id,
      category: "Development",
      link: "https://example.com/payment-course",
      lectures: 10,
    });
    courseId = String(course._id);
    orderNumber = "ORDER-PAYMENT-IDEMPOTENCY";
    await orders.create({
      orderNumber,
      mentee: mentee!._id,
      userId: mentee!._id,
      items: [
        {
          courseId: course._id,
          title: course.title,
          price: course.price,
          quantity: 1,
        },
      ],
      courses: [course._id],
      subtotalAmount: 250000,
      amount: 250000,
      totalAmount: 250000,
      billingInfo: {
        email: mentee!.email,
        firstName: mentee!.firstName,
        lastName: mentee!.lastName,
      },
      paymentInfo: { method: "vnpay", paymentGateway: "vnpay" },
      paymentMethod: "vnpay",
      status: "processing",
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  const callbackPath = (valid: boolean): string => {
    const params: Record<string, string> = {
      vnp_Amount: "25000000",
      vnp_ResponseCode: "00",
      vnp_TransactionNo: "VNPAY-TRANSACTION-1",
      vnp_TransactionStatus: "00",
      vnp_TxnRef: orderNumber,
    };
    const signData = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    params.vnp_SecureHash = valid
      ? crypto
          .createHmac("sha512", process.env.VNPAY_HASH_SECRET!)
          .update(signData)
          .digest("hex")
      : "invalid";
    return `/api/v1/payment/vnpay/ipn?${new URLSearchParams(params).toString()}`;
  };

  it("rejects an invalid signature without changing the order", async () => {
    await request(app.getHttpServer())
      .get(callbackPath(false))
      .expect(200, { RspCode: "97", Message: "Invalid signature" });
    expect((await orders.findOne({ orderNumber }))?.status).toBe("processing");
    expect(await events.countDocuments()).toBe(0);
  });

  it("processes concurrent duplicate callbacks exactly once", async () => {
    const responses = await Promise.all([
      request(app.getHttpServer()).get(callbackPath(true)).expect(200),
      request(app.getHttpServer()).get(callbackPath(true)).expect(200),
    ]);

    expect(
      responses
        .map(({ body }) => (body as { RspCode: string }).RspCode)
        .sort(),
    ).toEqual(["00", "02"]);
    expect((await orders.findOne({ orderNumber }))?.status).toBe("paid");
    expect(await events.countDocuments()).toBe(1);
    expect(await purchases.countDocuments({ mentee: menteeId, course: courseId })).toBe(1);
    const course = await courses.findById(courseId);
    expect(course?.mentees.filter((id) => String(id) === menteeId)).toHaveLength(1);

    const returned = await request(app.getHttpServer())
      .get(callbackPath(true).replace("/vnpay/ipn", "/vnpay/return"))
      .expect(200);
    expect(returned.body.data.order.status).toBe("paid");
    expect(await events.countDocuments()).toBe(1);
  });

  it("verifies and deduplicates MoMo IPN callbacks", async () => {
    const course = await courses.create({
      title: "MoMo payment course",
      description: "A second course purchased through a MoMo callback.",
      price: 300000,
      mentor: mentorId,
      category: "Development",
      link: "https://example.com/momo-course",
      lectures: 5,
    });
    const momoOrder = "ORDER-MOMO-IDEMPOTENCY";
    await orders.create({
      orderNumber: momoOrder,
      mentee: menteeId,
      userId: menteeId,
      items: [
        {
          courseId: course._id,
          title: course.title,
          price: course.price,
          quantity: 1,
        },
      ],
      courses: [course._id],
      subtotalAmount: 300000,
      amount: 300000,
      totalAmount: 300000,
      billingInfo: {
        email: "payment-mentee@example.com",
        firstName: "Payment",
        lastName: "Mentee",
      },
      paymentInfo: { method: "momo", paymentGateway: "momo" },
      paymentMethod: "momo",
      status: "processing",
    });
    const body: Record<string, string | number> = {
      partnerCode: "TEST_MOMO",
      orderId: momoOrder,
      requestId: "MOMO-REQUEST-1",
      amount: 300000,
      orderInfo: "Payment test",
      orderType: "momo_wallet",
      transId: "MOMO-TRANSACTION-1",
      resultCode: 0,
      message: "Successful.",
      payType: "qr",
      responseTime: 1,
      extraData: "",
    };
    const raw = [
      `accessKey=${process.env.MOMO_ACCESS_KEY}`,
      `amount=${body.amount}`,
      `extraData=${body.extraData}`,
      `message=${body.message}`,
      `orderId=${body.orderId}`,
      `orderInfo=${body.orderInfo}`,
      `orderType=${body.orderType}`,
      `partnerCode=${body.partnerCode}`,
      `payType=${body.payType}`,
      `requestId=${body.requestId}`,
      `responseTime=${body.responseTime}`,
      `resultCode=${body.resultCode}`,
      `transId=${body.transId}`,
    ].join("&");
    const signature = crypto
      .createHmac("sha256", process.env.MOMO_SECRET_KEY!)
      .update(raw)
      .digest("hex");

    await request(app.getHttpServer())
      .post("/api/v1/payment/momo/ipn")
      .send({ ...body, signature: "invalid" })
      .expect(400, { message: "Invalid signature" });
    await request(app.getHttpServer())
      .post("/api/v1/payment/momo/ipn")
      .send({ ...body, signature })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/payment/momo/ipn")
      .send({ ...body, signature })
      .expect(200);

    expect(await events.countDocuments({ provider: "momo" })).toBe(1);
    expect(
      await purchases.countDocuments({ mentee: menteeId, course: course._id }),
    ).toBe(1);
  });
});
