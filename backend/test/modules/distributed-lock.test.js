import assert from "node:assert/strict";
import test from "node:test";

test("distributed lock runs one owner and releases only its token", async () => {
  const module = await import(
    "../../src/infrastructure/redis/distributed-lock.js"
  ).catch(() => ({}));
  assert.equal(typeof module.withLock, "function");

  let storedToken = "another-owner";
  const busyClient = {
    async set() { return null; },
    async eval() { return 0; },
  };
  let ran = false;
  await assert.rejects(
    module.withLock("scheduler", 1000, async () => { ran = true; }, { client: busyClient }),
    (error) => error.code === "LOCK_NOT_ACQUIRED"
  );
  assert.equal(ran, false);

  const client = {
    async set(_key, token) { storedToken = token; return "OK"; },
    async eval(_script, { arguments: [token] }) {
      if (storedToken !== token) return 0;
      storedToken = null;
      return 1;
    },
  };
  const result = await module.withLock("scheduler", 1000, async () => "done", {
    client,
    token: "owner-1",
  });
  assert.equal(result, "done");
  assert.equal(storedToken, null);
});
