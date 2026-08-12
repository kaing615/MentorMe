import type { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import type { Model } from "mongoose";
import request from "supertest";
import { SiteAdministratorBootstrapService } from "../../src/administration/site-administrator-bootstrap.service";
import { User } from "../../src/identity/user.schema";
import { createApplication } from "../../src/main";

describe("administration", () => {
  let app: INestApplication;
  let users: Model<User>;
  let bootstrap: SiteAdministratorBootstrapService;
  let siteToken: string;
  let adminToken: string;
  let menteeId: string;
  let adminId: string;

  beforeAll(async () => {
    app = await createApplication();
    users = app.get<Model<User>>(getModelToken(User.name));
    bootstrap = app.get(SiteAdministratorBootstrapService);
    await users.deleteMany({});
    const site = await bootstrap.ensure();
    const [admin, mentee] = await users.create([
      {
        email: "child-admin@example.com",
        userName: "child_admin",
        firstName: "Child",
        lastName: "Admin",
        password: await bcrypt.hash("ChildPassword1!", 10),
        role: "admin",
        roles: ["admin"],
        adminLevel: "admin",
        roleBeforeAdmin: "mentee",
        isVerified: true,
      },
      {
        email: "future-admin@example.com",
        userName: "future_admin",
        firstName: "Future",
        lastName: "Admin",
        password: await bcrypt.hash("FuturePassword1!", 10),
        role: "mentee",
        roles: ["mentee"],
        isVerified: true,
      },
    ]);
    const jwt = app.get(JwtService);
    siteToken = await jwt.signAsync({ id: String(site._id) });
    adminToken = await jwt.signAsync({ id: String(admin!._id) });
    adminId = String(admin!._id);
    menteeId = String(mentee!._id);
  });

  afterAll(async () => {
    await users.deleteMany({});
    await app.close();
  });

  it("creates one Site administrator without resetting later settings", async () => {
    const created = await users.findOne({ adminLevel: "site_administrator" });
    expect(created?.email).toBe("test-site-admin@example.com");
    expect(created?.role).toBe("admin");
    expect(created?.roles).toContain("admin");
    expect(created?.isVerified).toBe(true);
    expect(await bcrypt.compare("TestPassword1!", created?.password || "")).toBe(true);

    const changedHash = await bcrypt.hash("ChangedPassword2!", 10);
    await users.updateOne(
      { _id: created?._id },
      { $set: { firstName: "Changed", password: changedHash } },
    );
    await bootstrap.ensure();

    const preserved = await users.findOne({ adminLevel: "site_administrator" });
    expect(await users.countDocuments({ adminLevel: "site_administrator" })).toBe(1);
    expect(preserved?.firstName).toBe("Changed");
    expect(await bcrypt.compare("ChangedPassword2!", preserved?.password || "")).toBe(true);
  });

  it("lists and suspends ordinary accounts but protects the Site administrator", async () => {
    const listed = await request(app.getHttpServer())
      .get("/api/v1/admin/users")
      .query({ search: "future-admin", role: "mentee" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(listed.body.data.items).toHaveLength(1);
    expect(listed.body.data.items[0].password).toBeUndefined();

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${menteeId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Repeated policy violations" })
      .expect(200);
    expect((await users.findById(menteeId))?.isSuspended).toBe(true);

    const site = await users.findOne({ adminLevel: "site_administrator" });
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${String(site?._id)}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Must remain protected" })
      .expect(403);
  });

  it("allows only Site administrator to grant and revoke Admin access", async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${menteeId}/grant-admin`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${menteeId}/restore`)
      .set("Authorization", `Bearer ${siteToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${menteeId}/grant-admin`)
      .set("Authorization", `Bearer ${siteToken}`)
      .expect(200);
    expect((await users.findById(menteeId))?.adminLevel).toBe("admin");

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${menteeId}/revoke-admin`)
      .set("Authorization", `Bearer ${siteToken}`)
      .expect(200);
    const restored = await users.findById(menteeId);
    expect(restored?.role).toBe("mentee");
    expect(restored?.roles).not.toContain("admin");
  });

  it("updates administrator profile, email and password with current-password checks", async () => {
    await request(app.getHttpServer())
      .patch("/api/v1/admin/settings/profile")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ firstName: "Operations", lastName: "Admin" })
      .expect(200);

    await request(app.getHttpServer())
      .patch("/api/v1/admin/settings/email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "operations-admin@example.com", currentPassword: "wrong" })
      .expect(400);

    await request(app.getHttpServer())
      .patch("/api/v1/admin/settings/password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ currentPassword: "ChildPassword1!", newPassword: "NewChildPassword2!" })
      .expect(200);
    expect(await bcrypt.compare("NewChildPassword2!", (await users.findById(adminId))?.password || "")).toBe(true);
  });

  it("returns an operational overview and filtered audit history", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/overview")
      .expect(401);
    const overview = await request(app.getHttpServer())
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(overview.body.data.metrics.totalUsers).toBe(3);
    expect(overview.body.data).toEqual(expect.objectContaining({
      needsAttention: expect.any(Object),
      recentActivity: expect.any(Array),
    }));

    const audit = await request(app.getHttpServer())
      .get("/api/v1/admin/audit?action=user.suspended")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(audit.body.data.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "user.suspended" })]),
    );
  });
});
