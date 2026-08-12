import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { MentorEarning } from "../../src/commerce/mentor-earning.schema";
import { Order } from "../../src/commerce/order.schema";
import { User } from "../../src/identity/user.schema";
import { Availability } from "../../src/mentoring/availability.schema";
import { Booking } from "../../src/mentoring/booking.schema";
import { Profile } from "../../src/mentoring/profile.schema";
import { createApplication } from "../../src/main";

describe("paid booking commerce", () => {
  let app: INestApplication;
  let connection: Connection;
  let bookings: Model<Booking>;
  let earnings: Model<MentorEarning>;
  let orders: Model<Order>;
  let profiles: Model<Profile>;
  let mentorToken: string;
  let menteeToken: string;
  let adminToken: string;
  let mentorId: string;
  let bookingId: string;
  let orderNumber: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    profiles = app.get<Model<Profile>>(getModelToken(Profile.name));
    const availabilities = app.get<Model<Availability>>(
      getModelToken(Availability.name),
    );
    bookings = app.get<Model<Booking>>(getModelToken(Booking.name));
    earnings = app.get<Model<MentorEarning>>(getModelToken(MentorEarning.name));
    orders = app.get<Model<Order>>(getModelToken(Order.name));
    const [mentor, mentee, admin] = await users.create([
      {
        email: "paid-mentor@example.com",
        userName: "paid_mentor",
        firstName: "Paid",
        lastName: "Mentor",
        role: "mentor",
        roles: ["mentor"],
        isVerified: true,
      },
      {
        email: "paid-mentee@example.com",
        userName: "paid_mentee",
        firstName: "Paid",
        lastName: "Mentee",
        role: "mentee",
        roles: ["mentee"],
        isVerified: true,
      },
      {
        email: "paid-admin@example.com",
        userName: "paid_admin",
        firstName: "Paid",
        lastName: "Admin",
        role: "admin",
        roles: ["admin"],
        isVerified: true,
      },
    ]);
    mentorId = String(mentor!._id);
    await profiles.create({ user: mentor!._id, sessionPrice: 400000 });
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 30);
    date.setUTCHours(0, 0, 0, 0);
    await availabilities.create({
      mentor: mentor!._id,
      date,
      slots: [
        { start: "09:00", end: "10:00", status: "open" },
        { start: "10:00", end: "11:00", status: "open" },
      ],
    });
    const jwt = app.get(JwtService);
    mentorToken = await jwt.signAsync({ id: mentorId });
    menteeToken = await jwt.signAsync({ id: String(mentee!._id) });
    adminToken = await jwt.signAsync({ id: String(admin!._id) });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("captures server pricing and creates a booking order", async () => {
    expect((await profiles.findOne({}))?.sessionPrice).toBe(
      400000,
    );
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 30);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/booking/mentor/${mentorId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({
        date: date.toISOString().slice(0, 10),
        start: "09:00",
        end: "10:00",
      })
      .expect(200);

    expect(response.body.data.booking.price).toBe(400000);
    expect(response.body.data.booking.platformFeeAmount).toBe(60000);
    expect(response.body.data.booking.mentorNetAmount).toBe(340000);
    expect(response.body.data.booking.paymentStatus).toBe("unpaid");
    bookingId = String(response.body.data.booking._id);
    orderNumber = String(response.body.data.order.orderNumber);
    const order = await orders.findOne({ orderNumber });
    expect(order?.type).toBe("booking");
    expect(order?.totalAmount).toBe(400000);
  });

  it("keeps the meeting link private until the booking is paid", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/booking/confirm/${bookingId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ meetingLink: "https://meet.google.com/abc-defg-hij" })
      .expect(200);

    const unpaid = await request(app.getHttpServer())
      .get("/api/v1/booking/mentee")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(unpaid.body.data[0].meetingLink).toBeUndefined();

    await request(app.getHttpServer())
      .post("/api/v1/payment/admin/manual-confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ orderNumber, transactionId: "BOOKING-MANUAL-1" })
      .expect(200);

    const paid = await bookings.findById(bookingId);
    expect(paid?.paymentStatus).toBe("paid");
    expect(await earnings.countDocuments({ booking: bookingId })).toBe(1);
    const visible = await request(app.getHttpServer())
      .get("/api/v1/booking/mentee")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(visible.body.data[0].meetingLink).toBe(
      "https://meet.google.com/abc-defg-hij",
    );
  });

  it("creates a full refund request for an early mentee cancellation", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/booking/cancel/${bookingId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ reason: "Schedule changed" })
      .expect(200);

    expect(response.body.data.booking.paymentStatus).toBe("refund_pending");
    expect(response.body.data.booking.refundAmount).toBe(400000);
    expect((await earnings.findOne({ booking: bookingId }))?.status).toBe(
      "cancelled",
    );

    const refunded = await request(app.getHttpServer())
      .patch(`/api/v1/booking/admin/${bookingId}/refund`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ refundReference: "VNPAY-REFUND-1" })
      .expect(200);
    expect(refunded.body.data.booking.paymentStatus).toBe("refunded");
    expect((await orders.findOne({ orderNumber }))?.status).toBe("refunded");
  });

  it("makes a completed paid booking eligible for mentor payout", async () => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 30);
    const created = await request(app.getHttpServer())
      .post(`/api/v1/booking/mentor/${mentorId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({
        date: date.toISOString().slice(0, 10),
        start: "10:00",
        end: "11:00",
      })
      .expect(200);
    const id = created.body.data.booking._id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/booking/confirm/${id}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ meetingLink: "https://meet.google.com/payout-test" })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/payment/admin/manual-confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderNumber: String(created.body.data.order.orderNumber),
        transactionId: "BOOKING-MANUAL-2",
      })
      .expect(200);
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    await bookings.updateOne({ _id: id }, { $set: { date: yesterday } });

    await request(app.getHttpServer())
      .post(`/api/v1/booking/finish/${id}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);

    expect((await earnings.findOne({ booking: id }))?.status).toBe("eligible");
  });

  it("lets Admin cancel but not finish an active paid session", async () => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 30);
    await (app.get<Model<Availability>>(getModelToken(Availability.name))).updateOne(
      { mentor: mentorId },
      { $push: { slots: { start: "11:00", end: "12:00", status: "open" } } },
    );
    const created = await request(app.getHttpServer())
      .post(`/api/v1/booking/mentor/${mentorId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ date: date.toISOString().slice(0, 10), start: "11:00", end: "12:00" })
      .expect(200);
    const id = created.body.data.booking._id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/booking/confirm/${id}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/payment/admin/manual-confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ orderNumber: created.body.data.order.orderNumber, transactionId: "ADMIN-CANCEL-PAID" })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/booking/finish/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(403);
    const cancelled = await request(app.getHttpServer())
      .post(`/api/v1/booking/admin/${id}/cancel`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Safety incident requires cancellation" })
      .expect(200);
    expect(cancelled.body.data.booking.status).toBe("cancelled");
    expect(cancelled.body.data.booking.paymentStatus).toBe("refund_pending");
    expect(cancelled.body.data.booking.refundAmount).toBe(400000);
  });
});
