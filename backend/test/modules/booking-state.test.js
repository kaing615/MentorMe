import assert from "node:assert/strict";
import test from "node:test";

test("booking state machine accepts only documented transitions", async () => {
  const module = await import("../../src/modules/booking/booking-state.js").catch(
    () => ({})
  );
  assert.equal(typeof module.assertBookingTransition, "function");

  for (const [from, to] of [
    ["pending", "active"],
    ["pending", "rejected"],
    ["pending", "cancelled"],
    ["active", "finished"],
    ["active", "cancelled"],
  ]) {
    assert.doesNotThrow(() => module.assertBookingTransition(from, to));
  }
  for (const [from, to] of [
    ["pending", "finished"],
    ["rejected", "active"],
    ["finished", "cancelled"],
    ["cancelled", "pending"],
  ]) {
    assert.throws(
      () => module.assertBookingTransition(from, to),
      (error) => error.code === "INVALID_BOOKING_TRANSITION"
    );
  }
});

test("booking date normalization rejects invalid input before database queries", async () => {
  const { normalizeBookingDay } = await import(
    "../../src/modules/booking/booking-state.js"
  );
  assert.throws(
    () => normalizeBookingDay("not-a-date"),
    (error) => error.code === "INVALID_BOOKING_DATE"
  );
  assert.equal(
    normalizeBookingDay("2026-08-09").toISOString(),
    "2026-08-09T00:00:00.000Z"
  );
});
