import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import { Types } from "mongoose";
import request from "supertest";
import { Cart } from "../../src/commerce/cart.schema";
import { MentorEarning } from "../../src/commerce/mentor-earning.schema";
import { Discount } from "../../src/commerce/discount.schema";
import { MomoProvider } from "../../src/commerce/providers/momo.provider";
import type { PaymentProvider } from "../../src/commerce/payment-provider";
import { PaymentService } from "../../src/commerce/payment.service";
import { User } from "../../src/identity/user.schema";
import { Course } from "../../src/learning/course.schema";
import { PurchasedCourse } from "../../src/learning/purchased-course.schema";
import { createApplication } from "../../src/main";

describe("commerce", () => {
  let app: INestApplication;
  let connection: Connection;
  let carts: Model<Cart>;
  let courses: Model<Course>;
  let purchases: Model<PurchasedCourse>;
  let earnings: Model<MentorEarning>;
  let courseId: string;
  let userToken: string;
  let mentorToken: string;
  let adminToken: string;
  let userId: string;
  let firstOrder: string;
  let paidOrder: string;
  let cancellableOrder: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    carts = app.get<Model<Cart>>(getModelToken(Cart.name));
    purchases = app.get<Model<PurchasedCourse>>(
      getModelToken(PurchasedCourse.name),
    );
    earnings = app.get<Model<MentorEarning>>(getModelToken(MentorEarning.name));
    const users = app.get<Model<User>>(getModelToken(User.name));
    courses = app.get<Model<Course>>(getModelToken(Course.name));
    const jwt = app.get(JwtService);
    const discounts = app.get<Model<Discount>>(getModelToken(Discount.name));
    const [mentor, user, admin] = await users.create([
      {
        email: "commerce-mentor@example.com",
        userName: "commerce_mentor",
        firstName: "Commerce",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "commerce-user@example.com",
        userName: "commerce_user",
        firstName: "Commerce",
        lastName: "User",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "commerce-admin@example.com",
        userName: "commerce_admin",
        firstName: "Commerce",
        lastName: "Admin",
        role: "admin",
        isVerified: true,
      },
    ]);
    const course = await courses.create({
      title: "Commerce course",
      description: "A course used to exercise cart and order workflows.",
      price: 125000,
      mentor: mentor!._id,
      category: "Development",
      link: "https://example.com/commerce-course",
      lectures: 10,
    });
    courseId = String(course._id);
    const discountEnd = new Date();
    discountEnd.setUTCDate(discountEnd.getUTCDate() + 7);
    await discounts.create({
      code: "SAVE10",
      type: "percent",
      value: 10,
      endDate: discountEnd,
      quantity: 100,
      isActive: true,
    });
    userToken = await jwt.signAsync({ id: String(user!._id) });
    mentorToken = await jwt.signAsync({ id: String(mentor!._id) });
    userId = String(user!._id);
    adminToken = await jwt.signAsync({ id: String(admin!._id) });
    jest.spyOn(app.get(MomoProvider), "create").mockResolvedValue({
      redirectUrl: "https://momo.example.com/pay",
      providerReference: "MOMO-REQUEST",
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  const directOrder = async (targetCourseId = courseId): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        courses: [{ courseId: targetCourseId, price: 1 }],
        totalAmount: 1,
        billingInfo: {
          email: "commerce-user@example.com",
          firstName: "Commerce",
          lastName: "User",
        },
      })
      .expect(200);
    expect(response.body.data.order.totalAmount).toBe(125000);
    return response.body.data.order.orderNumber as string;
  };

  it("supports cart routes and backward-compatible aliases", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ courseId })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ courseId })
      .expect(400);

    const cart = await request(app.getHttpServer())
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    expect(cart.body.data.totalCourses).toBe(1);
    expect(cart.body.data.totalPrice).toBe(125000);

    const discounted = await request(app.getHttpServer())
      .put("/api/v1/cart")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ discountCode: "SAVE10" })
      .expect(200);
    expect(discounted.body.data.discountAmount).toBe(12500);
    expect(discounted.body.data.totalPrice).toBe(112500);

    const check = await request(app.getHttpServer())
      .get(`/api/v1/cart/check/${courseId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    expect(check.body.data.inCart).toBe(true);
    await request(app.getHttpServer())
      .put(`/api/v1/cart/update/${courseId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 2 })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/v1/cart/remove/${courseId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ courseId })
      .expect(200);
  });

  it("creates an order from the cart and exposes owned views", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        billingInfo: {
          email: "commerce-user@example.com",
          firstName: "Commerce",
          lastName: "User",
        },
        paymentMethod: "vnpay",
      })
      .expect(200);
    firstOrder = created.body.data.order.orderNumber as string;
    expect(created.body.data.order.totalAmount).toBe(112500);
    expect(created.body.data.order.currency).toBe("VND");
    expect(await carts.countDocuments()).toBe(1);

    const list = await request(app.getHttpServer())
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    expect(list.body.data.orders).toHaveLength(1);
    await request(app.getHttpServer())
      .get(`/api/v1/orders/${firstOrder}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    const stats = await request(app.getHttpServer())
      .get("/api/v1/orders/statistics")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    expect(stats.body.data.statistics.totalOrders).toBe(1);
  });

  it("enforces admin order commands and explicit transitions", async () => {
    cancellableOrder = await directOrder();
    await request(app.getHttpServer())
      .get("/api/v1/orders/admin/all")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get("/api/v1/orders/admin/all")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .put(`/api/v1/orders/admin/${cancellableOrder}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "processing" })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/api/v1/orders/${cancellableOrder}/cancel`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "No longer needed" })
      .expect(200);
  });

  it("creates payment links and restricts manual confirmation", async () => {
    paidOrder = await directOrder();
    const created = await request(app.getHttpServer())
      .post("/api/v1/payment/vnpay/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderNumber: paidOrder })
      .expect(200);
    expect(created.body.data.paymentUrl).toContain("vnp_TxnRef");

    await request(app.getHttpServer())
      .get(`/api/v1/payment/status/${paidOrder}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/payment/manual")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderNumber: paidOrder })
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/v1/payment/admin/manual-confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ orderNumber: paidOrder, transactionId: "MANUAL-1" })
      .expect(200);
    expect(await purchases.countDocuments()).toBe(1);
    const earning = await earnings.findOne({ sourceType: "course" });
    expect(earning?.grossAmount).toBe(125000);
    expect(earning?.platformFeeAmount).toBe(18750);
    expect(earning?.netAmount).toBe(106250);
    expect(earning?.status).toBe("eligible");
    if (!earning) throw new Error("Expected mentor earning");
    const mentorEarnings = await request(app.getHttpServer())
      .get("/api/v1/mentor-earnings")
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(mentorEarnings.body.data.total).toBe(1);
    await request(app.getHttpServer())
      .patch(`/api/v1/mentor-earnings/admin/${String(earning._id)}/paid`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ payoutReference: "BANK-TRANSFER-1" })
      .expect(200);
    expect((await earnings.findById(earning._id))?.status).toBe("paid");
    expect(await carts.countDocuments()).toBe(0);
    expect(
      await connection.collection("notifications").countDocuments({
        recipient: new Types.ObjectId(userId),
        type: "payment_paid",
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ courses: [{ courseId }] })
      .expect(400);
  });

  it("rejects commerce mutations from mentor-only users", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ courseId })
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ courses: [{ courseId }] })
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/v1/payment/vnpay/create")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ orderNumber: firstOrder })
      .expect(403);
  });

  it("notifies the buyer when a payment callback fails", async () => {
    const failedCourse = await courses.create({
      title: "Failed payment course",
      description: "A separate course for failed payment coverage.",
      price: 125000,
      mentor: (await courses.findById(courseId))!.mentor,
      category: "Development",
      link: "https://example.com/failed-payment",
      lectures: 1,
    });
    const orderNumber = await directOrder(String(failedCourse._id));
    const provider: PaymentProvider = {
      create: () => Promise.reject(new Error("not used")),
      verifyCallback: () => Promise.resolve({
        provider: "momo",
        eventId: "FAILED-EVENT-1",
        transactionId: "FAILED-TRANSACTION-1",
        orderNumber,
        amount: 125000,
        status: "failed",
      }),
    };
    await app.get(PaymentService).handleCallback(provider, {
      query: {},
      body: {},
      headers: {},
    });
    expect(
      await connection.collection("notifications").countDocuments({
        recipient: new Types.ObjectId(userId),
        type: "payment_failed",
      }),
    ).toBe(1);
  });

  it("returns an explicit not-implemented response for Stripe", async () => {
    const anotherCourse = async (title: string) =>
      courses.create({
        title,
        description: "A separate course for payment-provider coverage.",
        price: 125000,
        mentor: (await courses.findById(courseId))!.mentor,
        category: "Development",
        link: `https://example.com/${title}`,
        lectures: 1,
      });
    const momoCourse = await anotherCourse("Momo course");
    const momoOrder = await directOrder(String(momoCourse._id));
    const momo = await request(app.getHttpServer())
      .post("/api/v1/payment/momo/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderNumber: momoOrder })
      .expect(200);
    expect(momo.body.data.paymentUrl).toBe("https://momo.example.com/pay");

    const stripeCourse = await anotherCourse("Stripe course");
    const orderNumber = await directOrder(String(stripeCourse._id));
    await request(app.getHttpServer())
      .post("/api/v1/payment/stripe/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderNumber })
      .expect(501);
  });
});
