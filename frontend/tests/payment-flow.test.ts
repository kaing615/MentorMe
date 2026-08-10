import assert from "node:assert/strict";
import test from "node:test";
import {
  paymentReturnOrderNumber,
  resolvePaymentProvider,
} from "../src/utils/payment-flow.ts";

test("checkout maps only supported payment methods to backend providers", () => {
  assert.equal(resolvePaymentProvider("VNPAY"), "vnpay");
  assert.equal(resolvePaymentProvider("Momo"), "momo");
  assert.throws(
    () => resolvePaymentProvider("Credit/Debit Card"),
    /not supported/i,
  );
  assert.throws(() => resolvePaymentProvider("Bank Transfer"), /not supported/i);
});

test("payment return extracts the provider order number", () => {
  assert.equal(
    paymentReturnOrderNumber("vnpay", new URLSearchParams("vnp_TxnRef=ORD-1")),
    "ORD-1",
  );
  assert.equal(
    paymentReturnOrderNumber("momo", new URLSearchParams("orderId=ORD-2")),
    "ORD-2",
  );
});
