import assert from "node:assert/strict";
import test from "node:test";

test("worker starts publisher and consumer and closes dependencies cleanly", async () => {
  const module = await import("../../src/worker.js").catch(() => ({}));
  assert.equal(typeof module.startWorker, "function");

  const calls = [];
  const timer = { unref() { calls.push("timer:unref"); } };
  const runtime = await module.startWorker({
    env: {
      mongoUrl: "mongodb://test",
      rabbitmqUrl: "amqp://test",
      instanceId: "worker-test",
    },
    logger: { info() {}, error() {}, warn() {} },
    connectMongo: async () => { calls.push("mongo:connect"); },
    disconnectMongo: async () => { calls.push("mongo:close"); },
    connectBroker: async () => ({
      publisher: {},
      consumer: {},
      async close() { calls.push("broker:close"); },
    }),
    declareTopology: async () => ({ workQueue: "work" }),
    publishOutboxBatch: async () => { calls.push("publish"); },
    cleanupPublishedOutbox: async () => { calls.push("cleanup"); },
    consumeEvent: async () => { calls.push("consume"); },
    store: {},
    setIntervalFn(callback, delay) {
      assert.equal(delay, 1000);
      calls.push("timer:start");
      return timer;
    },
    clearIntervalFn(value) {
      assert.equal(value, timer);
      calls.push("timer:clear");
    },
  });

  assert.deepEqual(calls.slice(0, 6), [
    "mongo:connect",
    "publish",
    "cleanup",
    "consume",
    "timer:start",
    "timer:unref",
  ]);
  await runtime.stop();
  assert.deepEqual(calls.slice(-3), ["timer:clear", "broker:close", "mongo:close"]);
});
