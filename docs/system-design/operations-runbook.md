# Operations Runbook

**Implementation status:** Target

## Release

1. Approve the protected GitHub `production` Environment for a tested Git SHA.
2. The workflow pushes immutable GHCR images, acquires server `flock`, removes one API slot from Nginx, drains it, replaces it, and polls readiness.
3. After smoke success, restore the slot and repeat for the second slot.
4. Record SHA, previous SHA, operator, timestamps, and smoke result.

## Rollback

Drain one slot, replace it with the recorded previous SHA, verify readiness, return traffic, and repeat. Image rollback never reverses data; expand/contract migrations keep both releases compatible. A failed migration stops before traffic switching.

## Dependency incidents

- Redis: bypass cache, alert on weaker per-process write limiting, pause lock-dependent schedulers, verify durable messages from MongoDB after reconnect.
- RabbitMQ: keep business/outbox writes, restore broker, watch publisher lag, and authenticated-redrive DLQs after cause removal.
- MongoDB: fail readiness and reject writes; do not return false success.
- VPS: provision a clean host, restore secrets and Compose configuration, validate Atlas data, start services, and pass smoke checks within 60 minutes.

## Backup evidence

Record Atlas backup timestamp daily. Run a monthly restore drill into an isolated database and record start/end time, restored record counts, application smoke result, and operator.
