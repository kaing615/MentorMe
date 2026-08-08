import assert from "node:assert/strict";
import test from "node:test";

function createMemoryModel() {
  const records = new Map();
  return {
    async create([input]) {
      const id = `${input.scope}:${input.key}`;
      if (records.has(id)) {
        const error = new Error("duplicate");
        error.code = 11000;
        throw error;
      }
      const record = { ...input, _id: id };
      records.set(id, record);
      return [record];
    },
    async findOne(query) {
      return records.get(`${query.scope}:${query.key}`) || null;
    },
    async updateOne(query, update) {
      const id = `${query.scope}:${query.key}`;
      Object.assign(records.get(id), update.$set);
    },
  };
}

test("durable idempotency returns one result for duplicate requests", async () => {
  const module = await import(
    "../../src/infrastructure/idempotency/idempotency.service.js"
  ).catch(() => ({}));
  assert.equal(typeof module.runIdempotent, "function");

  const model = createMemoryModel();
  let executions = 0;
  const input = {
    scope: "checkout",
    key: "checkout-123",
    requestHash: "hash-a",
    model,
    work: async () => {
      executions += 1;
      return { orderId: "order-1" };
    },
  };

  assert.deepEqual(await module.runIdempotent(input), { orderId: "order-1" });
  assert.deepEqual(await module.runIdempotent(input), { orderId: "order-1" });
  assert.equal(executions, 1);
});

test("durable idempotency rejects key reuse with different input", async () => {
  const { runIdempotent } = await import(
    "../../src/infrastructure/idempotency/idempotency.service.js"
  );
  const model = createMemoryModel();
  await runIdempotent({
    scope: "payment-webhook",
    key: "provider-event-1",
    requestHash: "hash-a",
    model,
    work: async () => ({ accepted: true }),
  });

  await assert.rejects(
    runIdempotent({
      scope: "payment-webhook",
      key: "provider-event-1",
      requestHash: "hash-b",
      model,
      work: async () => ({ accepted: false }),
    }),
    (error) => error.code === "IDEMPOTENCY_KEY_REUSED"
  );
});
