import assert from "node:assert/strict";
import test from "node:test";
import {
  isSuccessfulOrderStatus,
  paymentReturnOrderNumber,
  paymentReturnPath,
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

test("only paid or completed orders render as successful", () => {
  assert.equal(isSuccessfulOrderStatus("paid"), true);
  assert.equal(isSuccessfulOrderStatus("completed"), true);
  assert.equal(isSuccessfulOrderStatus("failed"), false);
  assert.equal(isSuccessfulOrderStatus("processing"), false);
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

test("booking payments return to bookings instead of course orders", () => {
  assert.equal(paymentReturnPath("BOOK-1", true), "/profile");
  assert.equal(
    paymentReturnPath("ORDER 1", false),
    "/order-detail?orderId=ORDER%201",
  );
});
