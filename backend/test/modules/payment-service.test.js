import assert from "node:assert/strict";
import test from "node:test";

test("verified payment grants each course once and tolerates duplicate callbacks", async () => {
  const module = await import(
    "../../src/modules/payment/payment.service.js"
  ).catch(() => ({}));
  assert.equal(typeof module.applyVerifiedPayment, "function");

  const order = {
    _id: "order-1",
    orderNumber: "ORD-1",
    status: "processing",
    totalAmount: 100,
    mentee: "mentee-1",
    aggregateVersion: 1,
    items: [{ courseId: "course-1", price: 100 }],
  };
  const purchases = new Set();
  const OrderModel = {
    async findOne() {
      return order;
    },
    async updateOne(_query, update) {
      Object.assign(order, update.$set);
      order.aggregateVersion += update.$inc.aggregateVersion;
      return { modifiedCount: 1 };
    },
  };
  const PurchasedCourseModel = {
    async updateOne(query) {
      purchases.add(`${query.mentee}:${query.course}`);
      return { upsertedCount: 1 };
    },
  };
  const CourseModel = { async updateOne() {} };
  const dependencies = {
    CourseModel,
    OrderModel,
    PurchasedCourseModel,
    appendEvent: async () => {},
    transactionRunner: async (work) => work({ id: "session-1" }),
  };
  const callback = {
    orderNumber: "ORD-1",
    provider: "vnpay",
    providerEventId: "event-1",
    transactionId: "transaction-1",
    amount: 100,
    success: true,
  };

  const first = await module.applyVerifiedPayment(callback, dependencies);
  const second = await module.applyVerifiedPayment(callback, dependencies);
  assert.equal(first.status, "completed");
  assert.equal(second.status, "completed");
  assert.equal(purchases.size, 1);
});

test("verified payment rejects an amount mismatch without granting access", async () => {
  const { applyVerifiedPayment } = await import(
    "../../src/modules/payment/payment.service.js"
  );
  const order = {
    _id: "order-1",
    orderNumber: "ORD-1",
    status: "processing",
    totalAmount: 100,
    mentee: "mentee-1",
    aggregateVersion: 1,
    items: [],
  };
  await assert.rejects(
    applyVerifiedPayment(
      {
        orderNumber: "ORD-1",
        provider: "momo",
        providerEventId: "event-2",
        transactionId: "transaction-2",
        amount: 99,
        success: true,
      },
      {
        OrderModel: { async findOne() { return order; } },
        transactionRunner: async (work) => work({ id: "session-1" }),
      }
    ),
    (error) => error.code === "PAYMENT_AMOUNT_MISMATCH"
  );
});

test("starting payment atomically moves only pending orders to processing", async () => {
  const { markOrderProcessing } = await import(
    "../../src/modules/payment/payment.service.js"
  );
  const order = { _id: "order-1", status: "pending", aggregateVersion: 1 };
  const OrderModel = {
    async findOneAndUpdate(query) {
      if (query.status !== order.status) return null;
      order.status = "processing";
      order.aggregateVersion += 1;
      return { ...order };
    },
  };
  const result = await markOrderProcessing("ORD-1", { OrderModel });
  assert.equal(result.status, "processing");
  await assert.rejects(
    markOrderProcessing("ORD-1", { OrderModel }),
    (error) => error.code === "ORDER_NOT_PENDING"
  );
});
