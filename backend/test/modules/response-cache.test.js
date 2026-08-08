import assert from "node:assert/strict";
import test from "node:test";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("response cache serves hits and stores successful misses", async () => {
  const module = await import(
    "../../src/middlewares/response-cache.middleware.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createResponseCache, "function");

  const values = new Map([["course:list", { items: [1] }]]);
  const cache = {
    async get(namespace, key) { return values.get(`${namespace}:${key}`) ?? null; },
    async set(namespace, key, _ttl, value) { values.set(`${namespace}:${key}`, value); },
  };
  const middleware = module.createResponseCache({
    cache,
    namespace: "course",
    ttlSeconds: 300,
    key: (request) => request.key,
  });

  const hitResponse = responseRecorder();
  let hitNext = 0;
  await middleware({ key: "list" }, hitResponse, () => { hitNext += 1; });
  assert.deepEqual(hitResponse.body, { items: [1] });
  assert.equal(hitNext, 0);

  const missResponse = responseRecorder();
  await middleware({ key: "detail" }, missResponse, () => {
    missResponse.status(200).json({ id: "course-1" });
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(values.get("course:detail"), { id: "course-1" });
});

test("cache invalidation runs only after a successful mutation response", async () => {
  const module = await import(
    "../../src/middlewares/response-cache.middleware.js"
  );
  assert.equal(typeof module.invalidateCacheOnSuccess, "function");

  const invalidated = [];
  const middleware = module.invalidateCacheOnSuccess({
    cache: {
      async invalidate(namespace) { invalidated.push(namespace); },
    },
    namespaces: () => ["course", "profile"],
  });

  const successful = responseRecorder();
  middleware({}, successful, () => {
    successful.status(200).json({ updated: true });
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(invalidated, ["course", "profile"]);

  const failed = responseRecorder();
  middleware({}, failed, () => {
    failed.status(400).json({ updated: false });
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(invalidated, ["course", "profile"]);
});
