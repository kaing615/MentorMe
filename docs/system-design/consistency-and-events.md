# Consistency and Events

**Implementation status:** Target

Booking slot reservation and order/payment completion use MongoDB transactions and compare-and-set state transitions. Durable idempotency uses a unique `(scope, key)` record; provider event IDs, transaction IDs, active slot reservations, purchased courses, and processed event IDs also have unique indexes.

The same business transaction updates the aggregate and appends a versioned outbox event. A leased publisher sends persistent messages with RabbitMQ publisher confirms. Consumers acknowledge only after the side effect and processed-event record commit. Duplicate or stale versions are ignored, version gaps retry, and truth-dependent handlers reload MongoDB.

Redis is disposable. A Redis outage bypasses caches, weakens rate limits to per-process fallback, pauses lock-dependent schedulers, and temporarily removes cross-replica realtime fan-out. A RabbitMQ outage does not reject an otherwise valid business write because the outbox retains the event for later publication.

See the editable [domain and state model](../diagrams/mentorme-domain.drawio) and [runtime flows](../diagrams/mentorme-flows.drawio).
