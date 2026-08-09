import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { User } from "../../src/identity/user.schema";
import { CloudinaryService } from "../../src/infrastructure/files/cloudinary.service";
import { Course } from "../../src/learning/course.schema";
import { EnrolmentService } from "../../src/learning/enrolment.service";
import { Lesson } from "../../src/learning/lesson.schema";
import { PurchasedCourse } from "../../src/learning/purchased-course.schema";
import { createApplication } from "../../src/main";

describe("learning", () => {
  let app: INestApplication;
  let connection: Connection;
  let courses: Model<Course>;
  let lessons: Model<Lesson>;
  let purchases: Model<PurchasedCourse>;
  let mentorId: string;
  let coMentorId: string;
  let menteeId: string;
  let courseId: string;
  let mentorToken: string;
  let menteeToken: string;
  let outsiderToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    courses = app.get<Model<Course>>(getModelToken(Course.name));
    lessons = app.get<Model<Lesson>>(getModelToken(Lesson.name));
    purchases = app.get<Model<PurchasedCourse>>(
      getModelToken(PurchasedCourse.name),
    );
    const jwt = app.get(JwtService);
    const [mentor, coMentor, mentee, outsider, admin] = await users.create([
      {
        email: "learning-mentor@example.com",
        userName: "learning_mentor",
        firstName: "Learning",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "learning-co-mentor@example.com",
        userName: "learning_co_mentor",
        firstName: "Co",
        lastName: "Mentor",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "learning-mentee@example.com",
        userName: "learning_mentee",
        firstName: "Learning",
        lastName: "Mentee",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "learning-outsider@example.com",
        userName: "learning_outsider",
        firstName: "Learning",
        lastName: "Outsider",
        role: "mentor",
        isVerified: true,
      },
      {
        email: "learning-admin@example.com",
        userName: "learning_admin",
        firstName: "Learning",
        lastName: "Admin",
        role: "admin",
        isVerified: true,
      },
    ]);
    mentorId = String(mentor!._id);
    coMentorId = String(coMentor!._id);
    menteeId = String(mentee!._id);
    mentorToken = await jwt.signAsync({ id: mentorId });
    menteeToken = await jwt.signAsync({ id: menteeId });
    outsiderToken = await jwt.signAsync({ id: String(outsider!._id) });
    adminToken = await jwt.signAsync({ id: String(admin!._id) });
    jest
      .spyOn(app.get(CloudinaryService), "uploadCourseThumbnail")
      .mockResolvedValue({
        url: "https://cdn.example.com/course.png",
        publicId: "course_thumbnails/course",
      });
    jest.spyOn(app.get(CloudinaryService), "delete").mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("creates, lists, aliases, and updates courses", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/course")
      .set("Authorization", `Bearer ${mentorToken}`)
      .field("title", "Practical NestJS")
      .field("courseOverview", "Build reliable NestJS services in production.")
      .field("price", "99")
      .field("category", "Development")
      .field("level", "Intermediate")
      .field("lectures", "12")
      .field("duration", "6.5")
      .field("driveLink", "https://example.com/course")
      .field("tags", '["NestJS","TypeScript"]')
      .field("language", '["English"]')
      .attach("thumbnail", Buffer.from("image"), {
        filename: "course.png",
        contentType: "image/png",
      })
      .expect(201);
    courseId = created.body.data.data._id as string;

    const [singular, plural] = await Promise.all([
      request(app.getHttpServer()).get("/api/v1/course?search=NestJS").expect(200),
      request(app.getHttpServer()).get("/api/v1/courses?search=NestJS").expect(200),
    ]);
    expect(plural.body).toEqual(singular.body);
    expect(singular.body.data.courses).toHaveLength(1);

    await request(app.getHttpServer())
      .put(`/api/v1/course/${courseId}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .field("title", "Unauthorized edit")
      .expect(403);
    const updated = await request(app.getHttpServer())
      .put(`/api/v1/course/${courseId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .field("title", "Practical NestJS Updated")
      .expect(200);
    expect(updated.body.data.title).toBe("Practical NestJS Updated");
  });

  it("serves detail, related, mentor, and own-course views", async () => {
    await courses.create({
      title: "Related TypeScript",
      description: "A related course with enough description text.",
      price: 49,
      mentor: mentorId,
      category: "Development",
      level: "Beginner",
      link: "https://example.com/related",
      lectures: 8,
    });

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/course/${courseId}`)
      .expect(200);
    expect(detail.body.data.course.courseId).toBe(courseId);

    const related = await request(app.getHttpServer())
      .get(`/api/v1/course/related?courseId=${courseId}&limit=6`)
      .expect(200);
    expect(related.body.data.courses).toHaveLength(1);

    const byMentor = await request(app.getHttpServer())
      .get(`/api/v1/course/mentor/${mentorId}`)
      .expect(200);
    expect(byMentor.body.data.data.total).toBe(2);

    const own = await request(app.getHttpServer())
      .get("/api/v1/course/my-courses")
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(own.body.data.totalCourses).toBe(2);
  });

  it("manages course mentors and lessons with ownership checks", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/course/${courseId}/mentors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ mentorId: coMentorId })
      .expect(200);

    const lesson = await request(app.getHttpServer())
      .post(`/api/v1/course/${courseId}/content`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        title: "Module 1",
        videoUrl: "https://example.com/video",
        order: 1,
      })
      .expect(201);
    const lessonId = lesson.body.data.lessons[0]._id as string;

    await request(app.getHttpServer())
      .delete(`/api/v1/course/${courseId}/content/${lessonId}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/v1/course/${courseId}/content/${lessonId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(await lessons.findById(lessonId)).toBeNull();

    await request(app.getHttpServer())
      .delete(`/api/v1/course/${courseId}/mentors/${coMentorId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });

  it("grants idempotent access and exposes purchase and review routes", async () => {
    const enrolments = app.get(EnrolmentService);
    const orderId = new Types.ObjectId();
    await enrolments.grantCourseAccess({
      menteeId,
      courseId,
      orderId: String(orderId),
      price: 99,
    });
    await enrolments.grantCourseAccess({
      menteeId,
      courseId,
      orderId: String(orderId),
      price: 99,
    });
    expect(await purchases.countDocuments({ mentee: menteeId, course: courseId })).toBe(1);
    const course = await courses.findById(courseId);
    expect(course?.mentees.filter((id) => String(id) === menteeId)).toHaveLength(1);

    const status = await request(app.getHttpServer())
      .get(`/api/v1/course/${courseId}/purchase-status`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(status.body.data.isPurchased).toBe(true);

    await request(app.getHttpServer())
      .post(`/api/v1/course/${courseId}/reviews`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ rating: 5, comment: "Excellent course" })
      .expect(201);
    const reviews = await request(app.getHttpServer())
      .get(`/api/v1/course/${courseId}/reviews`)
      .expect(200);
    expect(reviews.body.data).toHaveLength(1);

    const list = await request(app.getHttpServer())
      .get("/api/v1/purchased-courses")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    const purchasedId = list.body.data.courses[0].purchasedCourseId as string;
    expect(list.body.data.totalCourses).toBe(1);

    await request(app.getHttpServer())
      .get(`/api/v1/purchased-courses/check/${courseId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/purchased-courses/details/${purchasedId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/purchased-courses/${purchasedId}/progress`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ progress: 75 })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/purchased-courses/${purchasedId}/review`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({ rating: 4, review: "Very useful" })
      .expect(200);

    const mentees = await request(app.getHttpServer())
      .get("/api/v1/purchased-courses/mentees")
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(mentees.body.data.mentees).toHaveLength(1);

    await request(app.getHttpServer())
      .delete(`/api/v1/purchased-courses/${purchasedId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);
    expect(await purchases.findById(purchasedId)).toBeNull();
  });

  it("deletes owned courses and their dependent learning records", async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/course/${courseId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .expect(200);
    expect(await courses.findById(courseId)).toBeNull();
  });
});
