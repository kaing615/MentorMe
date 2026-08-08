import assert from "node:assert/strict";
import test from "node:test";

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

test("cache-aside loads once and invalidation changes the visible namespace", async () => {
  const module = await import(
    "../../src/infrastructure/redis/cache-store.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createCacheStore, "function");

  const cache = module.createCacheStore(memoryRedis(), { timeoutMs: 100 });
  let loads = 0;
  const loader = async () => ({ version: ++loads });
  assert.deepEqual(await cache.getOrLoad("course", "top", 60, loader), {
    version: 1,
  });
  assert.deepEqual(await cache.getOrLoad("course", "top", 60, loader), {
    version: 1,
  });
  await cache.invalidate("course");
  assert.deepEqual(await cache.getOrLoad("course", "top", 60, loader), {
    version: 2,
  });
});

test("cache timeout bypasses Redis and preserves the database result", async () => {
  const { createCacheStore } = await import(
    "../../src/infrastructure/redis/cache-store.js"
  );
  const unavailable = {
    async get() { return new Promise(() => {}); },
    async set() { throw new Error("offline"); },
  };
  const cache = createCacheStore(unavailable, { timeoutMs: 10 });
  assert.deepEqual(
    await cache.getOrLoad("profile", "mentor-1", 60, async () => ({ id: 1 })),
    { id: 1 }
  );
});
