import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createApp } from "../../src/app.js";

test("metrics endpoint requires the operator bearer token", async () => {
  const module = await import(
    "../../src/infrastructure/observability/metrics.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createMetrics, "function");

  const metrics = module.createMetrics({ collectDefaults: false });
  const app = createApp({
    env: {
      corsOrigins: ["https://mentorme.example"],
      instanceId: "api-a",
      metricsToken: "operator-token",
    },
    includeApplicationRoutes: false,
    metrics,
  });

  await request(app).get("/metrics").expect(401);
  const response = await request(app)
    .get("/metrics")
    .set("authorization", "Bearer operator-token")
    .expect(200);
  assert.match(response.headers["content-type"], /text\/plain/);
  assert.match(response.text, /mentorme_http_request_duration_seconds/);
});

test("HTTP metrics use bounded route labels instead of raw URLs", async () => {
  const { createMetrics } = await import(
    "../../src/infrastructure/observability/metrics.js"
  );
  const metrics = createMetrics({ collectDefaults: false });
  const app = createApp({
    env: {
      corsOrigins: ["https://mentorme.example"],
      instanceId: "api-a",
      metricsToken: "operator-token",
    },
    includeApplicationRoutes: false,
    metrics,
  });

  await request(app).get("/health/live?userId=secret-123").expect(200);
  const response = await request(app)
    .get("/metrics")
    .set("authorization", "Bearer operator-token")
    .expect(200);
  assert.doesNotMatch(response.text, /secret-123/);
  assert.match(response.text, /route="\/health\/live"/);
});
