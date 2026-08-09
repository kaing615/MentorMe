import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { User } from "../../src/identity/user.schema";
import { Availability } from "../../src/mentoring/availability.schema";
import { createApplication } from "../../src/main";

describe("availability", () => {
  let app: INestApplication;
  let connection: Connection;
  let availabilities: Model<Availability>;
  let mentorId: string;
  let mentorToken: string;
  let menteeToken: string;
  let adminToken: string;
  let date: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    availabilities = app.get<Model<Availability>>(
      getModelToken(Availability.name),
    );
    const users = app.get<Model<User>>(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const [mentor, mentee, admin] = await users.create([
      {
        email: "availability-mentor@example.com",
        userName: "availability_mentor",
        firstName: "Availability",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "availability-mentee@example.com",
        userName: "availability_mentee",
        firstName: "Availability",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "availability-admin@example.com",
        userName: "availability_admin",
        firstName: "Availability",
        lastName: "Admin",
        role: "admin",
        isVerified: true,
      },
    ]);
    mentorId = String(mentor!._id);
    mentorToken = await jwt.signAsync({ id: mentorId });
    menteeToken = await jwt.signAsync({ id: String(mentee!._id) });
    adminToken = await jwt.signAsync({ id: String(admin!._id) });
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + 2);
    date = target.toISOString().slice(0, 10);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("supports the availability read and write routes", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/availability")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        date,
        slots: [
          { start: "09:00", end: "09:30" },
          { start: "09:30", end: "10:00", status: "blocked" },
        ],
      })
      .expect(201);
    const availabilityId = created.body.data.availability._id as string;

    const today = await request(app.getHttpServer())
      .get(`/api/v1/availability/today-schedule?date=${date}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(today.body.data.schedule.totalSlots).toBe(2);
    expect(today.body.data.schedule.openSlots).toBe(1);

    const range = await request(app.getHttpServer())
      .get(
        `/api/v1/availability/mentor/range?startDate=${date}&endDate=${date}`,
      )
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(range.body.data.count).toBe(1);

    const overview = await request(app.getHttpServer())
      .get("/api/v1/availability/overview")
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(overview.body.data.overview).toHaveLength(7);

    const schedules = await request(app.getHttpServer())
      .get("/api/v1/availability/my-schedules")
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(schedules.body.data.summary.totalSchedules).toBe(1);

    const publicView = await request(app.getHttpServer())
      .get(
        `/api/v1/availability/mentor/${mentorId}/public?startDate=${date}&endDate=${date}`,
      )
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(publicView.body.data.availabilities).toHaveLength(1);
    expect(publicView.body.data.availabilities[0].slots[0].bookedBy).toBeUndefined();

    await request(app.getHttpServer())
      .delete(`/api/v1/availability/${availabilityId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
  });

  it("rejects invalid slots and preserves a held slot during updates", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/availability")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        date,
        slots: [
          { start: "09:00", end: "09:30" },
          { start: "09:15", end: "09:45" },
        ],
      })
      .expect(400);

    const availability = await availabilities.create({
      mentor: mentorId,
      date,
      timezone: "Asia/Ho_Chi_Minh",
      slots: [
        { start: "13:00", end: "13:30", status: "open" },
        { start: "13:30", end: "14:00", status: "held" },
      ],
    });

    await request(app.getHttpServer())
      .post("/api/v1/availability")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ date, slots: [{ start: "13:00", end: "13:30" }] })
      .expect(201);
    const updated = await availabilities.findById(availability._id);
    expect(updated?.slots.map(({ status }) => status)).toEqual(["open", "held"]);

    await request(app.getHttpServer())
      .delete(`/api/v1/availability/${String(availability._id)}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(400);
  });

  it("restricts writes to mentors and cleanup to admins", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/availability")
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ date, slots: [{ start: "15:00", end: "15:30" }] })
      .expect(403);

    const oldDate = new Date();
    oldDate.setUTCDate(oldDate.getUTCDate() - 10);
    oldDate.setUTCHours(0, 0, 0, 0);
    await availabilities.create({
      mentor: mentorId,
      date: oldDate,
      slots: [{ start: "15:00", end: "15:30", status: "open" }],
    });

    await request(app.getHttpServer())
      .post("/api/v1/availability/cleanup-old")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ daysBack: 3 })
      .expect(403);
    const cleanup = await request(app.getHttpServer())
      .post("/api/v1/availability/cleanup-old")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ daysBack: 3 })
      .expect(200);
    expect(cleanup.body.data.deletedCount).toBe(1);
  });
});
