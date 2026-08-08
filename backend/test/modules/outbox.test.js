import assert from "node:assert/strict";
import test from "node:test";

test("outbox event requires a versioned aggregate envelope", async () => {
  const module = await import(
    "../../src/infrastructure/outbox/outbox.model.js"
  ).catch(() => ({}));
  assert.equal(typeof module.default, "function");

  const invalid = new module.default({ eventType: "booking.created" });
  await assert.rejects(invalid.validate(), /aggregateId|aggregateVersion|eventId/);

  const valid = new module.default({
    eventId: "evt-1",
    eventType: "booking.created",
    aggregateId: "booking-1",
    aggregateVersion: 1,
    payload: { bookingId: "booking-1" },
    occurredAt: new Date("2026-08-08T00:00:00.000Z"),
  });
  await valid.validate();
  assert.equal(valid.status, "pending");
});
