import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { CloudinaryService } from "../../src/infrastructure/files/cloudinary.service";
import { User } from "../../src/identity/user.schema";
import { createApplication } from "../../src/main";

describe("profiles", () => {
  let app: INestApplication;
  let connection: Connection;
  let menteeToken: string;
  let mentorToken: string;
  let mentorId: string;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const mentee = await users.create({
      email: "profile-mentee@example.com",
      userName: "profile_mentee",
      firstName: "Profile",
      lastName: "Mentee",
      role: "mentee",
      isVerified: true,
    });
    const mentor = await users.create({
      email: "profile-mentor@example.com",
      userName: "profile_mentor",
      firstName: "Profile",
      lastName: "Mentor",
      role: "mentor",
      isVerified: true,
    });
    menteeToken = await jwt.signAsync({ id: String(mentee._id) });
    mentorToken = await jwt.signAsync({ id: String(mentor._id) });
    mentorId = String(mentor._id);
    jest.spyOn(app.get(CloudinaryService), "uploadAvatar").mockResolvedValue({
      url: "https://cdn.example.com/profile-avatar.png",
      publicId: "avatars/profile-avatar",
    });
    jest
      .spyOn(app.get(CloudinaryService), "delete")
      .mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("returns the current user's merged profile", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);

    expect(response.body.data.user.email).toBe("profile-mentee@example.com");
    expect(response.body.data.profile.role).toBe("mentee");
  });

  it("returns a public mentor profile", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/profile/mentor/${mentorId}`)
      .expect(200);

    expect(response.body.data.profile.role).toBe("mentor");
    expect(response.body.data.totalMentees).toBe(0);
  });

  it("returns stable top-mentor metrics instead of random values", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/profile/top-mentors?limit=6")
      .expect(200);

    expect(response.body.data.mentors).toHaveLength(1);
    expect(response.body.data.mentors[0].averageRating).toBe(0);
    expect(response.body.data.mentors[0].totalStudents).toBe(0);
  });

  it("updates a mentee profile", async () => {
    const response = await request(app.getHttpServer())
      .put("/api/v1/profile/mentee")
      .set("Authorization", `Bearer ${menteeToken}`)
      .send({
        userName: "profile_mentee",
        firstName: "Updated",
        lastName: "Mentee",
        bio: "Learning with a mentor.",
        goal: "Become a stronger engineer.",
        languages: ["Vietnamese", "English"],
      })
      .expect(200);

    expect(response.body.data.user.firstName).toBe("Updated");
    expect(response.body.data.profile.goal).toBe(
      "Become a stronger engineer.",
    );
  });

  it("protects the current profile route", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/profile")
      .expect(401, { data: { status: 401, message: "Unauthorized" } });
  });

  it("updates a mentor profile", async () => {
    const response = await request(app.getHttpServer())
      .put("/api/v1/profile/mentor")
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({
        userName: "profile_mentor",
        firstName: "Profile",
        lastName: "Mentor",
        jobTitle: "Staff Engineer",
        category: "Development",
        bio: "I mentor engineers who want to improve practical backend architecture skills.",
        mentorReason: "I want to share production lessons with growing engineers.",
        experience: "Ten years building production services.",
        skills: ["TypeScript", "NestJS"],
      })
      .expect(200);

    expect(response.body.data.profile.jobTitle).toBe("Staff Engineer");
    expect(response.body.data.profile.skills).toEqual(["TypeScript", "NestJS"]);
  });

  it("changes the current user's avatar", async () => {
    const response = await request(app.getHttpServer())
      .put("/api/v1/profile/avatar")
      .set("Authorization", `Bearer ${menteeToken}`)
      .attach("avatar", Buffer.from("image"), {
        filename: "avatar.png",
        contentType: "image/png",
      })
      .expect(200);

    expect(response.body.data.avatarUrl).toBe(
      "https://cdn.example.com/profile-avatar.png",
    );
  });
});
