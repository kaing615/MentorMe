import assert from "node:assert/strict";
import test from "node:test";

const event = {
  eventId: "evt-1",
  eventType: "booking.created",
  aggregateId: "booking-1",
  aggregateVersion: 1,
  payloadVersion: 1,
  payload: { bookingId: "booking-1" },
  occurredAt: new Date("2026-01-01T00:00:00.000Z"),
};

test("outbox publisher marks an event published only after broker confirmation", async () => {
  const module = await import(
    "../../src/infrastructure/outbox/publisher.js"
  ).catch(() => ({}));
  assert.equal(typeof module.publishOutboxBatch, "function");

  const transitions = [];
  const repository = {
    async claimBatch() { return [event]; },
    async markPublished(eventId) { transitions.push(["published", eventId]); },
    async release(eventId, error) { transitions.push(["released", eventId, error]); },
  };
  const channel = {
    publish(_exchange, _routingKey, _content, _options, confirm) {
      confirm(null);
      return true;
    },
  };

  const result = await module.publishOutboxBatch({
    channel,
    repository,
    owner: "worker-a",
    leaseMs: 30_000,
    limit: 10,
  });

  assert.deepEqual(result, { claimed: 1, published: 1, failed: 0 });
  assert.deepEqual(transitions, [["published", "evt-1"]]);
});

test("outbox publisher releases a lease when broker confirmation fails", async () => {
  const { publishOutboxBatch } = await import(
    "../../src/infrastructure/outbox/publisher.js"
  );
  const transitions = [];
  const repository = {
    async claimBatch() { return [event]; },
    async markPublished(eventId) { transitions.push(["published", eventId]); },
    async release(eventId, error) { transitions.push(["released", eventId, error]); },
  };
  const channel = {
    publish(_exchange, _routingKey, _content, _options, confirm) {
      confirm(new Error("broker confirm failed"));
      return true;
    },
  };

  const result = await publishOutboxBatch({
    channel,
    repository,
    owner: "worker-a",
    leaseMs: 30_000,
    limit: 10,
  });

  assert.deepEqual(result, { claimed: 1, published: 0, failed: 1 });
  assert.deepEqual(transitions, [
    ["released", "evt-1", "broker confirm failed"],
  ]);
});
