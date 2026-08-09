import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app.js";
import HelpRequest from "../../src/models/help.model.js";
import User from "../../src/models/user.model.js";

const app = createApp();
const databaseName = "mentorme_nest_migration_contract";

before(async () => {
  process.env.JWT_SECRET = "contract-test-secret";
  await mongoose.connect(`mongodb://127.0.0.1:27017/${databaseName}`);
  await mongoose.connection.dropDatabase();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("legacy help endpoint returns the created response envelope", async () => {
  const response = await request(app).post("/api/v1/help/help-requests").send({
    guestName: "Contract User",
    guestEmail: "contract@example.com",
    subject: "Cannot update my profile",
    issueCategory: "Account Issues",
    priorityLevel: "Medium",
    issueDetails: "The profile form does not save my changes.",
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.success, true);
  assert.match(response.body.data.data.ticketNumber, /^TICKET-/);
});

test("legacy validation failure keeps its current shape", async () => {
  const response = await request(app).post("/api/v1/user/signup").send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Validation error");
  assert.ok(Array.isArray(response.body.details));
});

test("legacy protected route returns the unauthorized envelope", async () => {
  const response = await request(app).get("/api/v1/profile");

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, {
    data: { status: 401, message: "Unauthorized" },
  });
});

test("legacy admin route rejects an authenticated mentee", async () => {
  const user = await User.create({
    email: "mentee-contract@example.com",
    userName: "mentee-contract",
    firstName: "Contract",
    lastName: "Mentee",
    password: "not-used-in-this-test",
    role: "mentee",
    isVerified: true,
  });
  const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET);

  const response = await request(app)
    .get("/api/v1/help/help-requests")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 403);
  assert.deepEqual(response.body, {
    data: { status: 403, message: "Access denied." },
  });
});

test("legacy ticket lookup returns the missing-resource envelope", async () => {
  const response = await request(app).get(
    "/api/v1/help/help-requests/ticket/TICKET-NOT-FOUND?email=missing@example.com"
  );

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    data: { status: 404, message: "Help request not found." },
  });
});

test("legacy unexpected failures use the internal-error envelope", async () => {
  const originalFindOne = HelpRequest.findOne;
  HelpRequest.findOne = () => {
    throw new Error("contract failure");
  };

  try {
    const response = await request(app).get(
      "/api/v1/help/help-requests/ticket/TICKET-ERROR?email=error@example.com"
    );

    assert.equal(response.status, 500);
    assert.equal(response.body.data.status, 500);
    assert.equal(response.body.data.message, "Oops! Something went wrong");
  } finally {
    HelpRequest.findOne = originalFindOne;
  }
});
