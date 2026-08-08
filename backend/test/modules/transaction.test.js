import assert from "node:assert/strict";
import test from "node:test";

test("transaction helper retries transient errors and always ends sessions", async () => {
  const module = await import("../../src/infrastructure/transaction.js").catch(
    () => ({})
  );
  assert.equal(typeof module.withTransaction, "function");

  let attempts = 0;
  let ended = 0;
  const client = {
    async startSession() {
      return {
        async withTransaction(work) {
          attempts += 1;
          if (attempts === 1) {
            const error = new Error("write conflict");
            error.hasErrorLabel = (label) => label === "TransientTransactionError";
            throw error;
          }
          return work();
        },
        async endSession() {
          ended += 1;
        },
      };
    },
  };

  const result = await module.withTransaction(() => "committed", {
    client,
    maxAttempts: 2,
  });
  assert.equal(result, "committed");
  assert.equal(attempts, 2);
  assert.equal(ended, 2);
});
