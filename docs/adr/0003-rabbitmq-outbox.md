# ADR 0003: RabbitMQ with Transactional Outbox

**Status:** Accepted

MongoDB cannot atomically commit directly to RabbitMQ, so business transactions append durable versioned outbox rows. A confirmed publisher and idempotent consumers provide at-least-once delivery, retry, DLQ, and replay. Broker ordering is not a correctness assumption.
