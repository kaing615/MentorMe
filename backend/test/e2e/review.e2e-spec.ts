import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { User } from "../../src/identity/user.schema";
import { Booking } from "../../src/mentoring/booking.schema";
import { Review } from "../../src/mentoring/review.schema";
import { createApplication } from "../../src/main";

describe("reviews", () => {
  let app: INestApplication;
  let connection: Connection;
  let reviews: Model<Review>;
  let bookings: Model<Booking>;
  let mentorId: string;
  let menteeId: string;
  let bookingId: string;
  let menteeToken: string;
  let mentorToken: string;
  let outsiderToken: string;
  let courseId: Types.ObjectId;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    bookings = app.get<Model<Booking>>(getModelToken(Booking.name));
    reviews = app.get<Model<Review>>(getModelToken(Review.name));
    const jwt = app.get(JwtService);
    const [mentor, mentee, outsider] = await users.create([
      {
        email: "review-mentor@example.com",
        userName: "review_mentor",
        firstName: "Review",
        lastName: "Mentor",
        role: "mentor",
        roles: ["mentor", "mentee"],
        isVerified: true,
      },
      {
        email: "review-mentee@example.com",
        userName: "review_mentee",
        firstName: "Review",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "review-outsider@example.com",
        userName: "review_outsider",
        firstName: "Review",
        lastName: "Outsider",
        role: "mentee",
        isVerified: true,
      },
    ]);
    mentorId = String(mentor!._id);
    menteeId = String(mentee!._id);
    const booking = await bookings.create({
      relationship: new Types.ObjectId(),
      mentor: mentor!._id,
      mentee: mentee!._id,
      status: "active",
      date: new Date(),
      start: "09:00",
      end: "09:30",
      slotId: new Types.ObjectId(),
      availabilityId: new Types.ObjectId(),
    });
    bookingId = String(booking._id);
    courseId = new Types.ObjectId();
    await connection.collection("courses").insertOne({
      _id: courseId,
      title: "Reviewable course",
      mentor: mentor!._id,
      mentees: [mentee!._id],
    });
    menteeToken = await jwt.signAsync({ id: menteeId });
    mentorToken = await jwt.signAsync({ id: mentorId });
    outsiderToken = await jwt.signAsync({ id: String(outsider!._id) });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("creates sanitized reviews only for eligible targets", async () => {
    await connection.collection("courses").updateOne(
      { _id: courseId },
      { $addToSet: { mentees: new Types.ObjectId(mentorId) } },
    );
    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ targetType: "Course", target: String(courseId), rate: 5 })
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ targetType: "Mentor", target: mentorId, rate: 5 })
      .expect(403);

    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ targetType: "Booking", target: bookingId, rate: 5 })
      .expect(403);

    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ targetType: "Booking", target: bookingId, rate: 5 })
      .expect(403);
    await bookings.updateOne(
      { _id: bookingId },
      { $set: { status: "finished" } },
    );

    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ targetType: "Booking", target: bookingId, rate: 5 })
      .expect(403);

    const created = await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({
        targetType: "Booking",
        target: bookingId,
        rate: 5,
        content: "<script>alert(1)</script>Helpful session",
      })
      .expect(201);
    expect(created.body.data.content).toBe("Helpful session");
    expect(
      await connection.collection("notifications").countDocuments({
        recipient: new Types.ObjectId(mentorId),
        actor: new Types.ObjectId(menteeId),
        type: "review_received",
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ targetType: "Booking", target: bookingId, rate: 4 })
      .expect(400);

    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ targetType: "Course", target: String(courseId), rate: 4 })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ targetType: "Mentor", target: mentorId, rate: 5 })
      .expect(201);
    expect(
      await connection.collection("notifications").countDocuments({
        recipient: new Types.ObjectId(mentorId),
        type: "review_received",
      }),
    ).toBe(3);

    const mentorProfile = await request(app.getHttpServer())
      .get(`/api/v1/profile/mentor/${mentorId}`)
      .expect(200);
    expect(mentorProfile.body.data.profile.rate).toBe(5);
  });

  it("lists target, own, and mentor booking reviews", async () => {
    const target = await request(app.getHttpServer())
      .get(
        `/api/v1/reviews?targetType=Booking&target=${bookingId}&page=1&limit=20`,
      )
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(target.body.data.items).toHaveLength(1);
    expect(target.body.data.total).toBe(1);

    const own = await request(app.getHttpServer())
      .get("/api/v1/reviews/my")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    const ownItems = own.body.data.items as Array<{
      targetInfo: { title: string };
    }>;
    expect(ownItems).toHaveLength(3);
    expect(
      ownItems.map((item) => item.targetInfo.title),
    ).toEqual(
      expect.arrayContaining([
        "Consultation with Review Mentor",
        "Reviewable course",
        "Review Mentor",
      ]),
    );

    const mentor = await request(app.getHttpServer())
      .get(`/api/v1/reviews/booking/${mentorId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(mentor.body.data.items).toHaveLength(1);

    const courseReviews = await request(app.getHttpServer())
      .get("/api/v1/course/reviews")
      .expect(200);
    expect(courseReviews.body.data.totalReviews).toBe(1);
    expect(courseReviews.body.data.reviews[0].targetType).toBe("Course");
  });

  it("updates and deletes only as the review owner", async () => {
    const review = await reviews.findOne({
      author: menteeId,
      targetType: "Booking",
      target: bookingId,
    });
    const id = String(review!._id);

    await request(app.getHttpServer())
      .patch(`/api/v1/reviews/${id}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ rate: 1 })
      .expect(403);
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/reviews/${id}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ rate: 4, content: "Updated" })
      .expect(200);
    expect(updated.body.data.rate).toBe(4);

    await request(app.getHttpServer())
      .delete(`/api/v1/reviews/${id}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/v1/reviews/${id}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(await reviews.findById(id)).toBeNull();
  });

  it("rolls back the review when aggregate refresh fails", async () => {
    const target = new Types.ObjectId();
    await connection.collection("courses").insertOne({
      _id: target,
      title: "Atomic review target",
      mentor: new Types.ObjectId(mentorId),
      mentees: [new Types.ObjectId(menteeId)],
      blockAggregate: true,
    });
    await connection.db!.command({
      collMod: "courses",
      validator: {
        $or: [
          { blockAggregate: { $ne: true } },
          { rate: { $exists: false } },
        ],
      },
      validationLevel: "strict",
      validationAction: "error",
    });

    try {
      await request(app.getHttpServer())
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send({ targetType: "Course", target: String(target), rate: 5 })
        .expect(500);

      expect(
        await reviews.countDocuments({ targetType: "Course", target }),
      ).toBe(0);
      expect(
        await connection.collection("notifications").countDocuments({
          "metadata.target": String(target),
        }),
      ).toBe(0);
    } finally {
      await connection.db!.command({
        collMod: "courses",
        validator: {},
      });
    }
  });
});
