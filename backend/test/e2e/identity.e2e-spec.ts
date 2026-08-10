import type { INestApplication } from "@nestjs/common";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import bcrypt from "bcryptjs";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { EmailService } from "../../src/infrastructure/email/email.service";
import { CloudinaryService } from "../../src/infrastructure/files/cloudinary.service";
import { User } from "../../src/identity/user.schema";
import { createApplication } from "../../src/main";

describe("identity", () => {
  let app: INestApplication;
  let connection: Connection;
  let users: Model<User>;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    users = app.get<Model<User>>(getModelToken(User.name));
    jest
      .spyOn(app.get(EmailService), "sendVerification")
      .mockResolvedValue(undefined);
    jest
      .spyOn(app.get(EmailService), "sendPasswordReset")
      .mockResolvedValue(undefined);
    jest.spyOn(app.get(CloudinaryService), "uploadAvatar").mockResolvedValue({
      url: "https://cdn.example.com/avatar.png",
      publicId: "avatars/test-avatar",
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("signs up an activated mentee in the test environment", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/user/signup")
      .send({
        userName: "new_mentee",
        email: "new-mentee@example.com",
        password: "secret123",
        confirmPassword: "secret123",
        firstName: "New",
        lastName: "Mentee",
      })
      .expect(201);

    expect(response.body.data.message).toBe(
      "Đăng ký thành công! Tài khoản đã được kích hoạt.",
    );
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe("new-mentee@example.com");
    expect(response.body.data.user.password).toBeUndefined();
  });

  it("rejects a duplicate signup", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/user/signup")
      .send({
        userName: "duplicate_mentee",
        email: "new-mentee@example.com",
        password: "secret123",
        confirmPassword: "secret123",
        firstName: "Duplicate",
        lastName: "Mentee",
      })
      .expect(400, {
        data: { status: 400, message: "Email đã được sử dụng." },
      });
  });

  it("signs in with the current response contract", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/user/signin")
      .send({ email: "new-mentee@example.com", password: "secret123" })
      .expect(200);

    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe("new-mentee@example.com");
    expect(response.body.data.user.password).toBeUndefined();
  });

  it("uses one generic signin error", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/user/signin")
      .send({ email: "new-mentee@example.com", password: "wrong-password" })
      .expect(401, {
        data: { status: 401, message: "Email hoặc mật khẩu không đúng." },
      });
  });

  it("rejects malformed signup input with an explicit validation shape", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/user/signup")
      .send({})
      .expect(400);

    expect(response.body.message).toBe("Validation error");
    expect(response.body.details).toEqual(expect.any(Array));
  });

  it("does not reveal whether a forgot-password email exists", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/user/forgot-password")
      .send({ email: "missing@example.com" })
      .expect(200, {
        data: {
          message: "Nếu email này tồn tại, đã gửi liên kết đặt lại mật khẩu.",
        },
      });
  });

  it("verifies an email and returns a token", async () => {
    await users.create({
      email: "verify@example.com",
      userName: "verify_user",
      firstName: "Verify",
      lastName: "User",
      password: await bcrypt.hash("secret123", 10),
      role: "mentee",
      isVerified: false,
      verifyKey: "valid-verify-key",
      verifyKeyExpires: new Date(Date.now() + 60_000),
    });

    const response = await request(app.getHttpServer())
      .get("/api/v1/user/verify")
      .query({ email: "verify@example.com", verifyKey: "valid-verify-key" })
      .expect(200);

    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.isVerified).toBe(true);
  });

  it("resends verification for an unverified user", async () => {
    await users.create({
      email: "resend@example.com",
      userName: "resend_user",
      firstName: "Resend",
      lastName: "User",
      password: await bcrypt.hash("secret123", 10),
      role: "mentee",
      isVerified: false,
    });

    await request(app.getHttpServer())
      .post("/api/v1/user/resend-email")
      .send({ email: "resend@example.com" })
      .expect(200, {
        data: { message: "Đã gửi lại email xác thực thành công!" },
      });
  });

  it("resets an existing user's password", async () => {
    await users.create({
      email: "reset@example.com",
      userName: "reset_user",
      firstName: "Reset",
      lastName: "User",
      password: await bcrypt.hash("old-secret", 10),
      role: "mentee",
      isVerified: true,
    });

    await request(app.getHttpServer())
      .post("/api/v1/user/forgot-password")
      .send({ email: "reset@example.com" })
      .expect(200);
    const resetUser = await users.findOne({ email: "reset@example.com" });

    await request(app.getHttpServer())
      .post("/api/v1/user/reset-password")
      .send({
        email: "reset@example.com",
        token: resetUser?.resetToken,
        newPassword: "new-secret",
      })
      .expect(200, { data: { message: "Đặt lại mật khẩu thành công." } });

    await request(app.getHttpServer())
      .post("/api/v1/user/signin")
      .send({ email: "reset@example.com", password: "new-secret" })
      .expect(200);
  });

  it("signs up a mentor with an uploaded avatar", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/user/signupMentor")
      .field("userName", "new_mentor")
      .field("email", "new-mentor@example.com")
      .field("password", "secret123")
      .field("confirmPassword", "secret123")
      .field("firstName", "New")
      .field("lastName", "Mentor")
      .field("jobTitle", "Senior Engineer")
      .field("location", "Ho Chi Minh City")
      .field("category", "Development")
      .field("skills", "TypeScript,NestJS")
      .field(
        "bio",
        "I help engineers build reliable applications with practical architecture guidance.",
      )
      .field(
        "mentorReason",
        "I want to help new engineers avoid common production mistakes.",
      )
      .field("linkedinUrl", "https://linkedin.com/in/new-mentor")
      .attach("avatar", Buffer.from("image"), {
        filename: "avatar.png",
        contentType: "image/png",
      })
      .expect(201);

    expect(response.body.data.avatarUrl).toBe(
      "https://cdn.example.com/avatar.png",
    );
    expect(response.body.data.user.role).toBe("mentor");
    expect(response.body.data.user.roles).toEqual(["mentor"]);
  });

  it("upgrades the authenticated mentee instead of creating a duplicate user", async () => {
    const signin = await request(app.getHttpServer())
      .post("/api/v1/user/signin")
      .send({ email: "new-mentee@example.com", password: "secret123" })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post("/api/v1/user/applyMentor")
      .set("Authorization", `Bearer ${signin.body.data.token}`)
      .field("userName", "new_mentee")
      .field("firstName", "New")
      .field("lastName", "Mentee")
      .field("jobTitle", "Frontend Engineer")
      .field("location", "Ho Chi Minh City")
      .field("category", "Development")
      .field("skills", "React,TypeScript")
      .field(
        "bio",
        "I help learners build accessible frontend applications through practical guided projects.",
      )
      .field(
        "mentorReason",
        "I want to help learners grow with focused and practical feedback.",
      )
      .field("linkedinUrl", "https://linkedin.com/in/new-mentee")
      .attach("avatar", Buffer.from("image"), {
        filename: "avatar.png",
        contentType: "image/png",
      })
      .expect(201);

    expect(response.body.data.user.role).toBe("mentor");
    expect(response.body.data.user.roles).toEqual(["mentee", "mentor"]);
    expect(response.body.data.user.email).toBe("new-mentee@example.com");
    expect(await users.countDocuments({ email: "new-mentee@example.com" })).toBe(1);
  });
});
