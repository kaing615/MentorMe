import assert from "node:assert/strict";
import test from "node:test";

const envelope = {
  eventId: "evt-2",
  aggregateId: "booking-1",
  aggregateVersion: 2,
};

test("processed-event store rejects duplicates and defers aggregate version gaps", async () => {
  const module = await import(
    "../../src/infrastructure/outbox/processed-event.store.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createProcessedEventStore, "function");

  const duplicateStore = module.createProcessedEventStore({
    repository: {
      async findEvent() { return { status: "completed" }; },
      async latestVersion() { return 1; },
    },
  });
  assert.deepEqual(await duplicateStore.begin(envelope), {
    outcome: "duplicate",
  });

  const gapStore = module.createProcessedEventStore({
    repository: {
      async findEvent() { return null; },
      async latestVersion() { return 0; },
    },
  });
  assert.deepEqual(await gapStore.begin({ ...envelope, aggregateVersion: 3 }), {
    outcome: "gap",
  });
});

test("processed-event store acquires the next aggregate version and records completion", async () => {
  const module = await import(
    "../../src/infrastructure/outbox/processed-event.store.js"
  );
  const writes = [];
  const store = module.createProcessedEventStore({
    repository: {
      async findEvent() { return null; },
      async latestVersion() { return 1; },
      async acquire(value) { writes.push(["acquire", value.eventId]); return true; },
      async complete(value) { writes.push(["complete", value.eventId]); },
      async release(value) { writes.push(["release", value.eventId]); },
    },
  });

  assert.deepEqual(await store.begin(envelope), { outcome: "acquired" });
  await store.complete(envelope);
  await store.fail(envelope, new Error("temporary"));
  assert.deepEqual(writes, [
    ["acquire", "evt-2"],
    ["complete", "evt-2"],
    ["release", "evt-2"],
  ]);
});
