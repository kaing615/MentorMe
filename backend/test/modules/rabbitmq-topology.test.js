import assert from "node:assert/strict";
import test from "node:test";

test("RabbitMQ topology is durable and routes retries back to the work queue", async () => {
  const module = await import(
    "../../src/infrastructure/rabbitmq/topology.js"
  ).catch(() => ({}));
  assert.equal(typeof module.declareTopology, "function");

  const calls = [];
  const channel = {
    async assertExchange(...args) { calls.push(["exchange", ...args]); },
    async assertQueue(...args) { calls.push(["queue", ...args]); },
    async bindQueue(...args) { calls.push(["bind", ...args]); },
    async prefetch(count) { calls.push(["prefetch", count]); },
  };
  const topology = await module.declareTopology(channel);

  assert.deepEqual(topology, {
    eventExchange: "mentorme.events",
    retryExchange: "mentorme.retry",
    deadExchange: "mentorme.dead",
    workQueue: "mentorme.domain-events",
    retryQueue: "mentorme.domain-events.retry",
    deadQueue: "mentorme.domain-events.dead",
  });
  assert.ok(calls.some((call) =>
    call[0] === "queue" &&
    call[1] === "mentorme.domain-events.retry" &&
    call[2].durable === true &&
    call[2].arguments["x-dead-letter-exchange"] === "mentorme.events"
  ));
  assert.ok(calls.some((call) =>
    call[0] === "bind" &&
    call[1] === "mentorme.domain-events" &&
    call[2] === "mentorme.events" &&
    call[3] === "#"
  ));
  assert.deepEqual(calls.at(-1), ["prefetch", 20]);
});
