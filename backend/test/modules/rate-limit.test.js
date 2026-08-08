import assert from "node:assert/strict";
import test from "node:test";

test("distributed limiter shares counters and returns a retry time", async () => {
  const module = await import(
    "../../src/infrastructure/redis/rate-limit.js"
  ).catch(() => ({}));
  assert.equal(typeof module.consumeRateLimit, "function");

  let count = 0;
  const client = {
    async eval() {
      count += 1;
      return [count, 5000];
    },
  };
  const first = await module.consumeRateLimit({
    client,
    key: "login:127.0.0.1",
    limit: 2,
    windowMs: 5000,
  });
  const second = await module.consumeRateLimit({
    client,
    key: "login:127.0.0.1",
    limit: 2,
    windowMs: 5000,
  });
  const third = await module.consumeRateLimit({
    client,
    key: "login:127.0.0.1",
    limit: 2,
    windowMs: 5000,
  });
  assert.equal(first.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(third.retryAfterMs, 5000);
});
