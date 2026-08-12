import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken } from "@nestjs/mongoose";
import { getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { EmailService } from "../../src/infrastructure/email/email.service";
import { User } from "../../src/identity/user.schema";
import { createApplication } from "../../src/main";
import { HelpRequest } from "../../src/support/help-request.schema";

describe("support", () => {
  let app: INestApplication;
  let connection: Connection;
  let ownedTicketId: string;
  let menteeToken: string;
  let adminToken: string;
  let email: EmailService;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "4002";
    process.env.MONGO_URL = "mongodb://127.0.0.1:27017/mentorme_nest_support_test";
    process.env.JWT_SECRET = "support-test-secret-with-enough-length";
    process.env.CORS_ORIGINS = "http://localhost:5173";
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    const helpRequests = app.get<Model<HelpRequest>>(
      getModelToken(HelpRequest.name),
    );
    const jwt = app.get(JwtService);
    email = app.get(EmailService);
    const mentee = await users.create({
      email: "support-mentee@example.com",
      userName: "support-mentee",
      firstName: "Support",
      lastName: "Mentee",
      role: "mentee",
      isVerified: true,
    });
    const admin = await users.create({
      email: "support-admin@example.com",
      userName: "support-admin",
      firstName: "Support",
      lastName: "Admin",
      role: "admin",
      isVerified: true,
    });
    const ownedTicket = await helpRequests.create({
      user: mentee._id,
      subject: "Owned ticket",
      issueCategory: "Technical Support",
      priorityLevel: "High",
      issueDetails: "A protected support request.",
    });
    ownedTicketId = String(ownedTicket._id);
    menteeToken = await jwt.signAsync({ id: String(mentee._id) });
    adminToken = await jwt.signAsync({ id: String(admin._id) });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it("creates and retrieves a guest help request", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/help/help-requests")
      .send({
        guestName: "Nest Contract User",
        guestEmail: "nest-contract@example.com",
        subject: "Cannot update my profile",
        issueCategory: "Account Issues",
        priorityLevel: "Medium",
        issueDetails: "The profile form does not save my changes.",
      })
      .expect(201);

    expect(created.body.data.success).toBe(true);
    const ticketNumber = created.body.data.data.ticketNumber as string;

    const found = await request(app.getHttpServer())
      .get(`/api/v1/help/help-requests/ticket/${ticketNumber}`)
      .query({ email: "nest-contract@example.com" })
      .expect(200);

    expect(found.body.data.ticketNumber).toBe(ticketNumber);
  });

  it("does not reveal a ticket to a mismatched email", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/help/help-requests/ticket/TICKET-NOT-FOUND")
      .query({ email: "wrong@example.com" })
      .expect(404);
  });

  it("rejects an unauthenticated request for owned tickets", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/help/help-requests/my")
      .expect(401, { data: { status: 401, message: "Unauthorized" } });
  });

  it("lists the authenticated user's tickets", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/help/help-requests/my")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0]._id).toBe(ownedTicketId);
  });

  it("lets an owner view a ticket by id", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/help/help-requests/${ownedTicketId}`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(200);

    expect(response.body.data._id).toBe(ownedTicketId);
  });

  it("rejects a non-admin ticket listing", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/help/help-requests")
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(403, { data: { status: 403, message: "Access denied." } });
  });

  it("lets an admin list and update tickets", async () => {
    const listed = await request(app.getHttpServer())
      .get("/api/v1/help/help-requests")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(listed.body.data.total).toBeGreaterThanOrEqual(1);

    const filtered = await request(app.getHttpServer())
      .get("/api/v1/help/help-requests")
      .query({ status: "Open", priority: "High", category: "Technical Support" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0]._id).toBe(ownedTicketId);

    const updated = await request(app.getHttpServer())
      .put(`/api/v1/help/help-requests/${ownedTicketId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Resolved", adminResponse: "<strong>Fixed</strong>" })
      .expect(200);
    expect(updated.body.data.data.status).toBe("Resolved");
    expect(updated.body.data.data.adminResponse).toBe(
      "<strong>Fixed</strong>",
    );
  });

  it("stores an admin response and emails the requester", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/help/help-requests")
      .send({
        guestName: "Email Requester",
        guestEmail: "email-requester@example.com",
        subject: "Need an answer",
        issueCategory: "General Inquiry",
        priorityLevel: "Medium",
        issueDetails: "Please respond to this support request.",
      })
      .expect(201);
    const listed = await request(app.getHttpServer())
      .get("/api/v1/help/help-requests")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const tickets = listed.body.data.items as Array<{ _id: string; ticketNumber: string }>;
    const ticket = tickets.find(
      (item: { ticketNumber: string }) =>
        item.ticketNumber === String(created.body.data.data.ticketNumber),
    );
    if (!ticket) throw new Error("Expected help request");
    jest.spyOn(email, "sendHelpResponse").mockResolvedValueOnce(undefined);

    const response = await request(app.getHttpServer())
      .post(`/api/v1/help/help-requests/${ticket._id}/respond`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ adminResponse: "<strong>We fixed it.</strong>", status: "Resolved" })
      .expect(201);

    expect(response.body.data.adminResponse).toBe("<strong>We fixed it.</strong>");
    expect(response.body.data.emailDeliveryStatus).toBe("sent");
    expect(response.body.data.emailRecipient).toBe("email-requester@example.com");
  });

  it("keeps a failed response and retries email without duplicating it", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/help/help-requests")
      .send({
        guestName: "Retry Requester",
        guestEmail: "retry-requester@example.com",
        subject: "Retry this answer",
        issueCategory: "General Inquiry",
        priorityLevel: "High",
        issueDetails: "The first email delivery should fail safely.",
      })
      .expect(201);
    const listed = await request(app.getHttpServer())
      .get("/api/v1/help/help-requests")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const tickets = listed.body.data.items as Array<{ _id: string; ticketNumber: string }>;
    const ticket = tickets.find(
      (item: { ticketNumber: string }) =>
        item.ticketNumber === String(created.body.data.data.ticketNumber),
    );
    if (!ticket) throw new Error("Expected help request");
    jest.spyOn(email, "sendHelpResponse")
      .mockRejectedValueOnce(new Error("SMTP unavailable"))
      .mockResolvedValueOnce(undefined);

    const failed = await request(app.getHttpServer())
      .post(`/api/v1/help/help-requests/${ticket._id}/respond`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ adminResponse: "Your saved answer", status: "In Progress" })
      .expect(201);
    expect(failed.body.data).toEqual(expect.objectContaining({
      adminResponse: "Your saved answer",
      emailDeliveryStatus: "failed",
      emailDeliveryError: "SMTP unavailable",
    }));

    await request(app.getHttpServer())
      .post(`/api/v1/help/help-requests/${ticket._id}/retry-email`)
      .set("Authorization", `Bearer ${menteeToken}`)
      .expect(403);
    const retried = await request(app.getHttpServer())
      .post(`/api/v1/help/help-requests/${ticket._id}/retry-email`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);
    expect(retried.body.data).toEqual(expect.objectContaining({
      adminResponse: "Your saved answer",
      respondedAt: String(failed.body.data.respondedAt),
      emailDeliveryStatus: "sent",
      emailDeliveryError: "",
    }));
  });
});
