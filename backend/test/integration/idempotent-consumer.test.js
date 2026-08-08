import assert from "node:assert/strict";
import test from "node:test";

function delivery({ attempt = 0, version = 1 } = {}) {
  const envelope = {
    eventId: "evt-1",
    eventType: "booking.created",
    aggregateId: "booking-1",
    aggregateVersion: version,
    payloadVersion: 1,
    payload: { bookingId: "booking-1" },
  };
  return {
    content: Buffer.from(JSON.stringify(envelope)),
    fields: { routingKey: envelope.eventType },
    properties: { headers: { "x-attempt": attempt } },
  };
}

test("consumer acknowledges duplicate events without repeating the side effect", async () => {
  const module = await import(
    "../../src/infrastructure/outbox/consumer.js"
  ).catch(() => ({}));
  assert.equal(typeof module.handleDelivery, "function");

  let handled = 0;
  const acknowledgements = [];
  const result = await module.handleDelivery({
    message: delivery(),
    channel: {
      ack(message) { acknowledgements.push(message); },
      publish() { throw new Error("must not retry a duplicate"); },
    },
    store: { async begin() { return { outcome: "duplicate" }; } },
    handler: async () => { handled += 1; },
  });

  assert.equal(result, "duplicate");
  assert.equal(handled, 0);
  assert.equal(acknowledgements.length, 1);
});

test("consumer retries version gaps and dead-letters exhausted failures", async () => {
  const { handleDelivery } = await import(
    "../../src/infrastructure/outbox/consumer.js"
  );
  const published = [];
  const channel = {
    ack() {},
    publish(exchange, routingKey, _content, options) {
      published.push({ exchange, routingKey, options });
      return true;
    },
  };

  const gap = await handleDelivery({
    message: delivery({ attempt: 1, version: 3 }),
    channel,
    store: { async begin() { return { outcome: "gap" }; } },
    handler: async () => {},
    retryExchange: "mentorme.retry",
    deadExchange: "mentorme.dead",
    maxAttempts: 3,
    baseDelayMs: 1000,
  });
  assert.equal(gap, "retry");
  assert.deepEqual(published[0], {
    exchange: "mentorme.retry",
    routingKey: "booking.created",
    options: {
      persistent: true,
      contentType: "application/json",
      messageId: "evt-1",
      expiration: "2000",
      headers: { "x-attempt": 2 },
    },
  });

  const exhausted = await handleDelivery({
    message: delivery({ attempt: 2 }),
    channel,
    store: {
      async begin() { return { outcome: "acquired" }; },
      async fail() {},
    },
    handler: async () => { throw new Error("email provider unavailable"); },
    retryExchange: "mentorme.retry",
    deadExchange: "mentorme.dead",
    maxAttempts: 3,
    baseDelayMs: 1000,
  });
  assert.equal(exhausted, "dead-letter");
  assert.equal(published[1].exchange, "mentorme.dead");
  assert.equal(published[1].options.headers["x-attempt"], 3);
  assert.equal(
    published[1].options.headers["x-error"],
    "email provider unavailable"
  );
});
