import assert from "node:assert/strict";
import test from "node:test";

test("outbox cleanup removes only published events older than retention", async () => {
  const module = await import(
    "../../src/infrastructure/outbox/cleanup.js"
  ).catch(() => ({}));
  assert.equal(typeof module.cleanupPublishedOutbox, "function");

  let filter;
  const result = await module.cleanupPublishedOutbox({
    model: {
      async deleteMany(value) { filter = value; return { deletedCount: 7 }; },
    },
    clock: () => new Date("2026-04-01T00:00:00.000Z"),
    retentionMs: 30 * 24 * 60 * 60 * 1000,
  });

  assert.deepEqual(filter, {
    status: "published",
    publishedAt: { $lt: new Date("2026-03-02T00:00:00.000Z") },
  });
  assert.equal(result, 7);
});
