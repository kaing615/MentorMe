import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

test("readiness degrades for optional dependencies but fails for MongoDB", async () => {
  const module = await import("../../src/app.js").catch(() => ({}));
  assert.equal(typeof module.createApp, "function", "createApp must exist");

  const health = {
    acceptingTraffic: true,
    dependencies: { mongo: true, redis: false, rabbitmq: false },
  };
  const app = module.createApp({ health, includeApplicationRoutes: false });

  const live = await request(app).get("/health/live").expect(200);
  assert.deepEqual(live.body, { status: "ok" });

  const degraded = await request(app).get("/health/ready").expect(200);
  assert.deepEqual(degraded.body, {
    status: "degraded",
    dependencies: { mongo: "up", redis: "down", rabbitmq: "down" },
  });

  health.dependencies.redis = true;
  health.dependencies.rabbitmq = true;
  const ready = await request(app).get("/health/ready").expect(200);
  assert.equal(ready.body.status, "ready");

  health.dependencies.mongo = false;
  const notReady = await request(app).get("/health/ready").expect(503);
  assert.equal(notReady.body.status, "not_ready");
});

test("request context preserves a valid incoming request ID", async () => {
  const { createApp } = await import("../../src/app.js");
  const health = {
    acceptingTraffic: true,
    dependencies: { mongo: true, redis: true, rabbitmq: true },
  };
  const app = createApp({ health, includeApplicationRoutes: false });

  const response = await request(app)
    .get("/health/live")
    .set("x-request-id", "req-portfolio-123")
    .expect(200);
  assert.equal(response.headers["x-request-id"], "req-portfolio-123");
});

test("health responses identify the serving replica", async () => {
  const { createApp } = await import("../../src/app.js");
  const env = {
    corsOrigins: ["https://mentorme.example"],
    instanceId: "api-b",
  };
  const health = {
    acceptingTraffic: true,
    dependencies: { mongo: true, redis: true, rabbitmq: true },
  };
  const response = await request(
    createApp({ env, health, includeApplicationRoutes: false })
  )
    .get("/health/ready")
    .expect(200);
  assert.equal(response.headers["x-instance-id"], "api-b");
});
