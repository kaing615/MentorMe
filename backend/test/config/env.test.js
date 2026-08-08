import assert from "node:assert/strict";
import test from "node:test";

const productionEnv = {
  NODE_ENV: "production",
  PORT: "4000",
  MONGO_URL: "mongodb+srv://cluster.example/mentorme",
  JWT_ACCESS_SECRET: "a".repeat(48),
  JWT_REFRESH_SECRET: "b".repeat(48),
  CORS_ORIGINS: "https://mentorme.example,https://admin.mentorme.example",
  FRONTEND_URL: "https://mentorme.example",
  PUBLIC_API_URL: "https://api.mentorme.example",
  REDIS_URL: "redis://:secret@redis:6379",
  RABBITMQ_URL: "amqp://app:secret@rabbitmq:5672",
};

test("production configuration rejects missing secrets", async () => {
  const module = await import("../../src/config/env.js").catch(() => ({}));
  assert.equal(typeof module.loadEnv, "function", "loadEnv must exist");

  const invalid = { ...productionEnv };
  delete invalid.JWT_REFRESH_SECRET;
  assert.throws(() => module.loadEnv(invalid), /JWT_REFRESH_SECRET/);
});

test("production configuration rejects weak secrets", async () => {
  const { loadEnv } = await import("../../src/config/env.js");
  assert.throws(
    () => loadEnv({ ...productionEnv, JWT_ACCESS_SECRET: "short" }),
    /JWT_ACCESS_SECRET/
  );
});

test("configuration normalizes origins and numeric limits", async () => {
  const { loadEnv } = await import("../../src/config/env.js");
  const env = loadEnv({
    ...productionEnv,
    PORT: "4100",
    SHUTDOWN_TIMEOUT_MS: "15000",
  });

  assert.deepEqual(env.corsOrigins, [
    "https://mentorme.example",
    "https://admin.mentorme.example",
  ]);
  assert.equal(env.port, 4100);
  assert.equal(env.shutdownTimeoutMs, 15000);
  assert.equal(Object.isFrozen(env), true);
});
