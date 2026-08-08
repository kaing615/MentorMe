import assert from "node:assert/strict";
import test from "node:test";

test("order state machine prevents incompatible payment callbacks", async () => {
  const module = await import("../../src/modules/payment/order-state.js").catch(
    () => ({})
  );
  assert.equal(typeof module.assertOrderTransition, "function");

  for (const [from, to] of [
    ["pending", "processing"],
    ["pending", "cancelled"],
    ["processing", "paid"],
    ["processing", "failed"],
    ["paid", "completed"],
    ["paid", "refunded"],
    ["completed", "refunded"],
  ]) {
    assert.doesNotThrow(() => module.assertOrderTransition(from, to));
  }
  for (const [from, to] of [
    ["cancelled", "paid"],
    ["refunded", "completed"],
    ["failed", "paid"],
    ["completed", "processing"],
  ]) {
    assert.throws(
      () => module.assertOrderTransition(from, to),
      (error) => error.code === "INVALID_ORDER_TRANSITION"
    );
  }
});
