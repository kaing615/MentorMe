import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../../src/app.js";

test("legacy app exposes its liveness response without opening a port", async () => {
  const response = await request(createApp()).get("/");

  assert.equal(response.status, 200);
  assert.equal(response.text, "Welcome to the MentorMe backend!");
});
