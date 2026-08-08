import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createCacheStore } from "../../src/infrastructure/redis/cache-store.js";

function memoryRedis() {
  const values = new Map();
  return {
    async get(key) { return values.get(key) ?? null; },
    async set(key, value) { values.set(key, value); return "OK"; },
    async incr(key) {
      const next = Number(values.get(key) || 0) + 1;
      values.set(key, String(next));
      return next;
    },
  };
}

test("public course responses are cached until a successful course mutation", async () => {
  let sourceVersion = 1;
  const router = express.Router();
  router.get("/course", (_request, response) => {
    response.json({ sourceVersion });
  });
  router.put("/course/:courseId", (_request, response) => {
    sourceVersion += 1;
    response.json({ updated: true });
  });

  const app = createApp({
    applicationRouter: router,
    cacheStore: createCacheStore(memoryRedis()),
    env: {
      corsOrigins: [],
      instanceId: "cache-test",
      jwtAccessSecret: "test-access-secret",
    },
  });

  const first = await request(app).get("/api/v1/course").expect(200);
  assert.deepEqual(first.body, { sourceVersion: 1 });

  sourceVersion = 99;
  const cached = await request(app).get("/api/v1/course").expect(200);
  assert.deepEqual(cached.body, { sourceVersion: 1 });

  await request(app).put("/api/v1/course/course-1").expect(200);
  const refreshed = await request(app).get("/api/v1/course").expect(200);
  assert.deepEqual(refreshed.body, { sourceVersion: 100 });
});

test("private profile reads are never shared through the public cache", async () => {
  const router = express.Router();
  router.get("/profile", (request, response) => {
    response.json({ authorization: request.get("authorization") });
  });

  const app = createApp({
    applicationRouter: router,
    cacheStore: createCacheStore(memoryRedis()),
    env: {
      corsOrigins: [],
      instanceId: "cache-test",
      jwtAccessSecret: "test-access-secret",
    },
  });

  const alice = await request(app)
    .get("/api/v1/profile")
    .set("authorization", "Bearer alice")
    .expect(200);
  const bob = await request(app)
    .get("/api/v1/profile")
    .set("authorization", "Bearer bob")
    .expect(200);

  assert.equal(alice.body.authorization, "Bearer alice");
  assert.equal(bob.body.authorization, "Bearer bob");
});
