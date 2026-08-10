import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import { Types } from "mongoose";
import request from "supertest";
import { User } from "../../src/identity/user.schema";
import { Course } from "../../src/learning/course.schema";
import { createApplication } from "../../src/main";

describe("engagement", () => {
  let app: INestApplication;
  let connection: Connection;
  let menteeToken: string;
  let menteeId: string;
  let mentorToken: string;
  let mentorId: string;
  let courseId: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    const courses = app.get<Model<Course>>(getModelToken(Course.name));
    const jwt = app.get(JwtService);
    const [mentee, mentor] = await users.create([
      {
        email: "engagement-mentee@example.com",
        userName: "engagement_mentee",
        firstName: "Engagement",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "engagement-mentor@example.com",
        userName: "engagement_mentor",
        firstName: "Engagement",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
    ]);
    mentorId = String(mentor!._id);
    menteeId = String(mentee!._id);
    menteeToken = await jwt.signAsync({ id: String(mentee!._id) });
    mentorToken = await jwt.signAsync({ id: mentorId });
    const course = await courses.create({
      title: "Favorite Course",
      description: "A real course used to verify favorites.",
      price: 25,
      mentor: mentor!._id,
      category: "Programming",
      link: "https://example.com/course",
      lectures: 4,
    });
    courseId = String(course._id);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("stores idempotent course and mentor favorites for a mentee", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/favorites/course/${courseId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/favorites/course/${courseId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/favorites/mentor/${mentorId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);

    const list = await request(app.getHttpServer())
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);

    expect(list.body.data.courses).toHaveLength(1);
    expect(list.body.data.courses[0]._id).toBe(courseId);
    expect(list.body.data.mentors).toHaveLength(1);
    expect(list.body.data.mentors[0]._id).toBe(mentorId);

    await request(app.getHttpServer())
      .delete(`/api/v1/favorites/course/${courseId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/favorites/course/${courseId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
  });

  it("rejects favorites for mentor-only users and invalid targets", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/favorites/course/${courseId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/v1/favorites/course/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(404);
  });

  it("lists and marks only the current user's notifications", async () => {
    const notifications = connection.collection("notifications");
    const firstId = new Types.ObjectId();
    await notifications.insertMany([
      {
        _id: firstId,
        recipient: new Types.ObjectId(menteeId),
        actor: new Types.ObjectId(mentorId),
        type: "booking_confirmed",
        title: "Booking confirmed",
        body: "Your mentor confirmed the session.",
        link: "/profile?tab=bookings",
        eventKey: `booking:confirmed:${String(firstId)}`,
        readAt: null,
        createdAt: new Date("2026-08-10T10:00:00.000Z"),
        updatedAt: new Date("2026-08-10T10:00:00.000Z"),
      },
      {
        recipient: new Types.ObjectId(menteeId),
        actor: new Types.ObjectId(mentorId),
        type: "message_received",
        title: "New message",
        body: "You have a new message.",
        link: `/messages/${mentorId}`,
        eventKey: `message:${String(new Types.ObjectId())}`,
        readAt: null,
        createdAt: new Date("2026-08-10T11:00:00.000Z"),
        updatedAt: new Date("2026-08-10T11:00:00.000Z"),
      },
      {
        recipient: new Types.ObjectId(mentorId),
        actor: new Types.ObjectId(menteeId),
        type: "booking_created",
        title: "New booking",
        body: "A mentee requested a session.",
        link: "/mentor-profile?tab=bookings",
        eventKey: `booking:created:${String(new Types.ObjectId())}`,
        readAt: null,
        createdAt: new Date("2026-08-10T12:00:00.000Z"),
        updatedAt: new Date("2026-08-10T12:00:00.000Z"),
      },
    ]);

    const list = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(list.body.data.items).toHaveLength(2);
    expect(list.body.data.unreadCount).toBe(2);
    expect(list.body.data.items[0].type).toBe("message_received");

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${String(firstId)}/read`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    const readAll = await request(app.getHttpServer())
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(readAll.body.data.modified).toBe(1);

    const refreshed = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(refreshed.body.data.unreadCount).toBe(0);
  });
});
