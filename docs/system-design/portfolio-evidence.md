# Portfolio Evidence

**Implementation status:** Mixed

## Safe claims

- Designed and implemented a scaled modular-monolith deployment with Nginx, two stateless Express slots, MongoDB Atlas, Redis, RabbitMQ, and a separate worker.
- Implemented transactional booking/payment state transitions, durable idempotency, transactional outbox publishing, consumer deduplication, bounded retry, and DLQ routing.
- Implemented Redis cache versioning, distributed rate limits/locks, Socket.IO Redis adapter integration, and JWT-authenticated WebSockets.
- Implemented rotating opaque refresh tokens stored as SHA-256 hashes, reuse-family revocation, 15-minute access JWTs, secure cookies, upload policy, NoSQL operator rejection, and production dependency gates.
- Implemented Prometheus HTTP metrics, correlation/W3C trace propagation, reproducible k6 profiles, immutable GHCR builds, protected GitHub Environment deployment, two-slot health gates, automatic rollback, and manual SHA rollback.

## Local verification record

| Area | Command | Local result |
| --- | --- | --- |
| Backend | `cd backend && npm test` | Pass; external Mongo/Redis cases skip without service URLs. |
| Frontend | `cd frontend && npm test && npm run build` | Pass; bundle-size warning remains recorded as debt. |
| Dependencies | `npm audit --omit=dev --audit-level=high` in both packages | Zero production vulnerabilities at the recorded lockfiles. |
| Documentation | `node scripts/verify-docs.mjs` and `node scripts/validate-drawio.mjs` | Pass. |
| Topology | `node tests/deploy/compose.test.mjs` and `docker compose ... config` | Pass without starting containers. |
| Delivery | `node tests/deploy/deploy-script.test.mjs`, `bash -n deploy/scripts/*.sh`, actionlint 1.7.12 | Pass. |

## Claims that are not yet safe

Do not claim the system is publicly deployed, supports a measured 100 RPS/200 WebSockets, survives real broker/database outages, has production distributed tracing, or meets an Atlas restore objective until the blocked external drills are executed and linked to an immutable Git SHA.
