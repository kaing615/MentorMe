import assert from "node:assert/strict";
import test from "node:test";

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) { this.headers[name] = String(value); },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("public limits fail open while write limits use half local capacity", async () => {
  const module = await import(
    "../../src/middlewares/rate-limit.middleware.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createRateLimit, "function");
  const redisClient = { async eval() { throw new Error("redis offline"); } };
  const request = { ip: "127.0.0.1", user: { id: "user-1" } };

  let publicNext = 0;
  await module.createRateLimit({
    redisClient,
    key: () => "public:127.0.0.1",
    limit: 4,
    windowMs: 60000,
    failureMode: "open",
  })(request, responseRecorder(), () => { publicNext += 1; });
  assert.equal(publicNext, 1);

  const writeLimit = module.createRateLimit({
    redisClient,
    key: () => "write:user-1",
    limit: 4,
    windowMs: 60000,
    failureMode: "local-half",
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let next = 0;
    await writeLimit(request, responseRecorder(), () => { next += 1; });
    assert.equal(next, 1);
  }
  const denied = responseRecorder();
  await writeLimit(request, denied, () => {});
  assert.equal(denied.statusCode, 429);
  assert.equal(denied.body.code, "RATE_LIMITED_DEGRADED");
});
