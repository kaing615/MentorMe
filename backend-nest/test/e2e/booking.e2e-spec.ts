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

describe("booking management", () => {
  let app: INestApplication;
  let connection: Connection;
  let availabilities: Model<Availability>;
  let bookings: Model<Booking>;
  let bookingId: string;
  let mentorToken: string;
  let menteeToken: string;
  let outsiderToken: string;
  let adminToken: string;

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
    const [mentor, mentee, outsider, admin] = await users.create([
      {
        email: "manage-mentor@example.com",
        userName: "manage_mentor",
        firstName: "Manage",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "manage-mentee@example.com",
        userName: "manage_mentee",
        firstName: "Manage",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "manage-outsider@example.com",
        userName: "manage_outsider",
        firstName: "Manage",
        lastName: "Outsider",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "manage-admin@example.com",
        userName: "manage_admin",
        firstName: "Manage",
        lastName: "Admin",
        role: "admin",
        isVerified: true,
      },
    ]);
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 7);
    date.setUTCHours(0, 0, 0, 0);
    const availability = await availabilities.create({
      mentor: mentor!._id,
      date,
      slots: [{ start: "14:00", end: "14:30", status: "booked" }],
    });
    const booking = await bookings.create({
      relationship: new Types.ObjectId(),
      mentor: mentor!._id,
      mentee: mentee!._id,
      status: "active",
      date,
      start: "14:00",
      end: "14:30",
      slotId: availability.slots[0]!._id,
      availabilityId: availability._id,
    });
    await availabilities.updateOne(
      { _id: availability._id, "slots._id": availability.slots[0]!._id },
      {
        $set: {
          "slots.$.bookingId": booking._id,
          "slots.$.bookedBy": mentee!._id,
        },
      },
    );
    bookingId = String(booking._id);
    mentorToken = await jwt.signAsync({ id: String(mentor!._id) });
    menteeToken = await jwt.signAsync({ id: String(mentee!._id) });
    outsiderToken = await jwt.signAsync({ id: String(outsider!._id) });
    adminToken = await jwt.signAsync({ id: String(admin!._id) });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("lists bookings for admins and each participant", async () => {
    const admin = await request(app.getHttpServer())
      .get("/api/v1/booking?status=active&limit=10")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(admin.body.data.items).toHaveLength(1);

    await request(app.getHttpServer())
      .get("/api/v1/booking")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(403);

    const mentor = await request(app.getHttpServer())
      .get("/api/v1/booking/mentor")
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(mentor.body.data).toHaveLength(1);
    expect(mentor.body.data[0].mentee.email).toBe("manage-mentee@example.com");

    const mentee = await request(app.getHttpServer())
      .get("/api/v1/booking/mentee")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(mentee.body.data).toHaveLength(1);
    expect(mentee.body.data[0].mentor.jobTitle).toBeUndefined();
  });

  it("updates notes only for a participant", async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/booking/${bookingId}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ notes: "Not allowed" })
      .expect(403);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/booking/${bookingId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ notes: "Bring architecture questions" })
      .expect(200);
    expect(updated.body.data.notes).toBe("Bring architecture questions");

    await request(app.getHttpServer())
      .patch(`/api/v1/booking/${bookingId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ status: "finished" })
      .expect(400);
  });

  it("deletes only as admin and frees the reserved slot", async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/booking/${bookingId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/v1/booking/${bookingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(await bookings.findById(bookingId)).toBeNull();
    const availability = await availabilities.findOne({});
    expect(availability?.slots[0]?.status).toBe("open");
    expect(availability?.slots[0]?.bookingId).toBeUndefined();
  });
});
