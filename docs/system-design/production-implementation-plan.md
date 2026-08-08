# MentorMe Production Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn MentorMe into a measured, secure, single-VPS production system with two API replicas, shared realtime state, durable asynchronous work, and health-gated CD.

**Architecture:** Keep the Express backend as a modular monolith. Cloudflare serves the Vite frontend and proxies HTTPS/WSS to Nginx; Nginx balances two stateless API replicas backed by MongoDB Atlas, Redis, RabbitMQ, and a separate worker. MongoDB transactions, durable idempotency, and an outbox protect correctness; Redis and RabbitMQ improve distribution without becoming sources of truth.

**Tech Stack:** Node.js 22, Express 5, React 19/Vite 6, MongoDB/Mongoose 8, Redis 7, RabbitMQ 4, Socket.IO 4, Nginx, Docker Compose, Pino, Prometheus/OpenTelemetry, Mocha/Supertest, Playwright, k6, GitHub Actions, GHCR.

## Global Constraints

- Target 100 concurrent users, 100 API requests/second, and 100–200 concurrent WebSockets.
- Recommended minimum host: 2 vCPU, 4 GB RAM, 80 GB SSD, and 20% headroom.
- MongoDB is authoritative; Redis and RabbitMQ must never hold the only durable business state.
- Booking, order, payment, idempotency, and outbox correctness must survive retries and process restarts.
- Production images use immutable Git SHA tags; schema changes use expand/contract migration.
- No Kubernetes, microservice split, or self-hosted MongoDB in production.
- Existing flows remain runnable after every task; new modules use TDD and legacy lint debt is baselined rather than hidden.

---

## File Map

- `backend/src/app.js`: Express composition without opening sockets or database connections.
- `backend/src/server.js`: dependency startup, HTTP/Socket.IO listener, readiness, and graceful shutdown.
- `backend/src/config/env.js`: validated environment contract and production-safe defaults.
- `backend/src/infrastructure/`: MongoDB, Redis, RabbitMQ, logging, metrics, idempotency, and outbox adapters.
- `backend/src/modules/booking/` and `backend/src/modules/payment/`: explicit state transitions and transactional application services.
- `backend/src/worker.js`: outbox publisher and background-consumer process.
- `deploy/`: production Compose, Nginx templates, rolling deploy, rollback, smoke, and host bootstrap scripts.
- `tests/`: backend unit/integration, Socket.IO, load, resilience, and deployment tests.
- `.github/workflows/`: CI quality gates, image publication, and protected production deployment.
- `docs/system-design/`, `docs/diagrams/`, `docs/adr/`: implementation-matched architecture and runbooks.

### Task 1: Architecture baseline and traceability

**Files:**
- Create: `docs/system-design/README.md`
- Create: `docs/system-design/current-architecture.md`
- Create: `docs/system-design/target-architecture.md`
- Create: `docs/system-design/quality-attributes.md`
- Create: `docs/system-design/consistency-and-events.md`
- Create: `docs/system-design/security.md`
- Create: `docs/system-design/testing-strategy.md`
- Create: `docs/system-design/operations-runbook.md`
- Create: `docs/system-design/acceptance-traceability.md`
- Create: `docs/adr/0001-scaled-modular-monolith.md`
- Create: `docs/adr/0002-redis-shared-state.md`
- Create: `docs/adr/0003-rabbitmq-outbox.md`
- Create: `docs/adr/0004-single-vps-deployment.md`
- Create: `docs/diagrams/mentorme-c4.drawio`
- Create: `docs/diagrams/mentorme-domain.drawio`
- Create: `docs/diagrams/mentorme-flows.drawio`
- Create: `docs/diagrams/exports/*.svg`

**Interfaces:**
- Consumes: approved requirements in `docs/system-design/production-system-design.md`.
- Produces: stable architecture vocabulary and one traceability row per acceptance criterion.

- [ ] **Step 1: Write a documentation verifier**

Create `scripts/verify-docs.mjs` to fail when required files are missing, Markdown links target missing local files, a target document claims unmeasured production results, or unfinished-marker tokens appear.

- [ ] **Step 2: Run the verifier to confirm the baseline fails**

Run: `node scripts/verify-docs.mjs`
Expected: non-zero exit with the missing architecture artifacts listed.

- [ ] **Step 3: Write architecture docs, ADRs, editable Draw.io sources, and SVG exports**

Every architecture page starts with `Implementation status: Current`, `Target`, or `Mixed`. The traceability table uses columns `Criterion`, `Implementation`, `Verification`, and `Status`; initial runtime rows are `Planned`.

- [ ] **Step 4: Validate docs and diagrams**

Run: `node scripts/verify-docs.mjs`
Expected: exit 0 with every required artifact present and linked.

- [ ] **Step 5: Commit**

```bash
git add docs scripts/verify-docs.mjs
git commit -m "docs: add production architecture baseline"
```

### Task 2: Runtime, configuration, and test foundation

**Files:**
- Create: `backend/src/config/env.js`
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Create: `backend/src/infrastructure/mongodb.js`
- Create: `backend/src/infrastructure/logger.js`
- Create: `backend/src/middlewares/request-context.middleware.js`
- Create: `backend/test/config/env.test.js`
- Create: `backend/test/http/health.test.js`
- Create: `backend/test/runtime/shutdown.test.js`
- Modify: `backend/src/index.js`
- Modify: `backend/package.json`
- Modify: `backend/.env.example`
- Modify: `frontend/src/api/clients/api.client.js`
- Modify: `frontend/src/api/clients/public.client.js`
- Modify: `frontend/src/api/clients/private.client.js`

**Interfaces:**
- Produces: `loadEnv(source)`, `createApp({ health, logger })`, `startServer(deps)`, `connectMongo(uri)`, `requestContext`, and `/health/live|ready`.

- [ ] **Step 1: Write failing environment and health tests**

Test that production rejects missing `MONGO_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, and weak secrets; test liveness returns 200 while readiness returns 503 until MongoDB/Redis/RabbitMQ dependency flags are ready.

- [ ] **Step 2: Verify the tests fail**

Run: `cd backend && npm test -- test/config/env.test.js test/http/health.test.js`
Expected: failure because the modules and endpoints do not exist.

- [ ] **Step 3: Implement the minimal runtime seams**

`loadEnv` returns a frozen object with parsed integer/time/list values. `createApp` installs request IDs, Pino HTTP logging, parsers, routes, stable 404/error handlers, and health routes. `startServer` connects dependencies, listens, and handles `SIGTERM`/`SIGINT` by marking readiness false, closing HTTP/Socket.IO, draining for at most `SHUTDOWN_TIMEOUT_MS`, and closing dependencies.

- [ ] **Step 4: Replace hard-coded application URLs**

Frontend clients consume `import.meta.env.VITE_API_BASE_URL`; Socket.IO consumes `VITE_SOCKET_URL`; backend links consume `FRONTEND_URL`. No runtime source may contain a production hostname or localhost fallback in production mode.

- [ ] **Step 5: Run foundation verification**

Run: `cd backend && npm test`
Run: `cd frontend && npm run build`
Run: `rg -n "localhost|127\\.0\\.0\\.1" backend/src frontend/src`
Expected: tests/build pass; remaining localhost matches are explicit development defaults only.

- [ ] **Step 6: Commit**

```bash
git add backend frontend
git commit -m "refactor(runtime): add production foundations"
```

### Task 3: State machines, transactions, and durable idempotency

**Files:**
- Create: `backend/src/modules/booking/booking-state.js`
- Create: `backend/src/modules/booking/booking.service.js`
- Create: `backend/src/modules/payment/order-state.js`
- Create: `backend/src/modules/payment/payment.service.js`
- Create: `backend/src/infrastructure/transaction.js`
- Create: `backend/src/infrastructure/idempotency/idempotency.model.js`
- Create: `backend/src/infrastructure/idempotency/idempotency.service.js`
- Create: `backend/src/infrastructure/outbox/outbox.model.js`
- Create: `backend/src/infrastructure/outbox/write-event.js`
- Create: `backend/test/modules/booking-state.test.js`
- Create: `backend/test/modules/order-state.test.js`
- Create: `backend/test/integration/booking-transaction.test.js`
- Create: `backend/test/integration/payment-idempotency.test.js`
- Modify: `backend/src/models/booking.model.js`
- Modify: `backend/src/models/order.model.js`
- Modify: `backend/src/models/purchasedCourse.model.js`
- Modify: `backend/src/controllers/booking.controller.js`
- Modify: `backend/src/controllers/payment.controller.js`

**Interfaces:**
- Produces: `assertBookingTransition(from, to)`, `assertOrderTransition(from, to)`, `withTransaction(work)`, `runIdempotent({ scope, key, requestHash, work })`, and `appendOutboxEvent(event, { session })`.

- [ ] **Step 1: Write state-machine and duplicate-operation tests**

Cover every allowed transition in Sections 5.1/5.2, reject all incompatible transitions, race two requests for one availability slot, submit one verified webhook twice, and force an exception after the slot/order update to prove transaction rollback.

- [ ] **Step 2: Verify red tests**

Run: `cd backend && npm test -- test/modules test/integration/booking-transaction.test.js test/integration/payment-idempotency.test.js`
Expected: failure because state and transaction services do not exist.

- [ ] **Step 3: Implement state and transaction primitives**

Use transition maps of frozen `Set` values, Mongoose sessions with bounded transaction retries for transient labels, unique `{ scope: 1, key: 1 }`, unique provider event/transaction indexes, unique purchased-course ownership, and a partial booking slot index covering `pending|active`.

- [ ] **Step 4: Move booking and payment mutations behind services**

Controllers validate/authorize HTTP input, then call services. Booking transactions update the matching `open` slot, booking, and outbox together. Payment provider calls occur outside transactions; verified results transition/grant/write events in a new transaction.

- [ ] **Step 5: Verify correctness and migration compatibility**

Run: `cd backend && npm test -- test/modules test/integration`
Expected: concurrent/duplicate/rollback cases pass and indexes build on a clean test database.

- [ ] **Step 6: Commit**

```bash
git add backend/src backend/test
git commit -m "feat(domain): enforce transactional workflows"
```

### Task 4: Production containers, Nginx, and two API slots

**Files:**
- Modify: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `deploy/compose.prod.yml`
- Create: `deploy/nginx/nginx.conf`
- Create: `deploy/nginx/conf.d/mentorme.conf`
- Create: `deploy/nginx/upstreams/api.conf`
- Create: `deploy/env/production.env.example`
- Create: `deploy/scripts/smoke.ps1`
- Create: `deploy/scripts/smoke.sh`
- Create: `tests/deploy/compose.test.mjs`

**Interfaces:**
- Consumes: `/health/live`, `/health/ready`, graceful shutdown.
- Produces: services `gateway`, `api-a`, `api-b`, `worker`, `redis`, `rabbitmq`, and `otel-collector`; loopback ports 4001/4002; public 80/443 only.

- [ ] **Step 1: Write a failing topology contract test**

Parse Compose/Nginx and assert two API slots share the same immutable image variable, only gateway publishes public ports, dependencies remain private, health checks exist, memory budgets match Section 11.1, and Nginx carries request/WebSocket headers.

- [ ] **Step 2: Verify the topology test fails**

Run: `node tests/deploy/compose.test.mjs`
Expected: missing production Compose and Nginx files.

- [ ] **Step 3: Build hardened images and topology**

Use a non-root user, `npm ci --omit=dev`, a pinned Node 22 Alpine base, init handling, read-only application filesystem where compatible, `no-new-privileges`, private networks, resource/log limits, named Redis/RabbitMQ volumes, and health checks.

- [ ] **Step 4: Validate and smoke the local production stack**

Run: `docker compose -f deploy/compose.prod.yml config`
Run: `node tests/deploy/compose.test.mjs`
Run: `docker compose -f deploy/compose.prod.yml up -d --build`
Run: `bash deploy/scripts/smoke.sh http://localhost`
Expected: gateway reaches both replica IDs and each health check is green.

- [ ] **Step 5: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore deploy tests/deploy
git commit -m "build(prod): add replicated compose topology"
```

### Task 5: Redis cache, rate limits, and cross-replica Socket.IO

**Files:**
- Create: `backend/src/infrastructure/redis/redis.client.js`
- Create: `backend/src/infrastructure/redis/cache-store.js`
- Create: `backend/src/infrastructure/redis/distributed-lock.js`
- Create: `backend/src/middlewares/rate-limit.middleware.js`
- Create: `backend/src/socket/authenticate-socket.js`
- Modify: `backend/src/socket/index.js`
- Modify: `backend/src/server.js`
- Create: `backend/test/integration/cache.test.js`
- Create: `backend/test/integration/rate-limit.test.js`
- Create: `backend/test/integration/socket-replicas.test.js`
- Create: `backend/test/resilience/redis-outage.test.js`

**Interfaces:**
- Produces: `createRedisClients(url)`, `cache.getOrLoad(key, ttl, loader)`, `cache.invalidate(namespace)`, `withLock(key, ttl, work)`, route limiters, and authenticated Socket.IO rooms.

- [ ] **Step 1: Write red cache/rate/socket/outage tests**

Assert TTL and invalidation, shared counters across two app instances, JWT-authenticated cross-replica message delivery, 100 ms Redis timeout, MongoDB read fallback, per-process write limiter fallback, and scheduler pause.

- [ ] **Step 2: Verify tests fail**

Run: `cd backend && npm test -- test/integration/cache.test.js test/integration/rate-limit.test.js test/integration/socket-replicas.test.js test/resilience/redis-outage.test.js`

- [ ] **Step 3: Implement bounded Redis adapters and Socket.IO adapter**

Use separate command/pub/sub clients, versioned cache namespaces, Redis-backed rate-limit keys by IP/user, JWT handshake verification rather than trusted `userId`, and WebSocket-only production transport.

- [ ] **Step 4: Run Redis verification**

Run the four tests with Redis available, stop Redis during the resilience case, restart it, and confirm reconnect/invalidation behavior.

- [ ] **Step 5: Commit**

```bash
git add backend/src backend/test
git commit -m "feat(redis): share cache limits and sockets"
```

### Task 6: RabbitMQ outbox publisher and idempotent workers

**Files:**
- Create: `backend/src/infrastructure/rabbitmq/broker.js`
- Create: `backend/src/infrastructure/rabbitmq/topology.js`
- Create: `backend/src/infrastructure/outbox/publisher.js`
- Create: `backend/src/infrastructure/outbox/processed-event.model.js`
- Create: `backend/src/infrastructure/outbox/consumer.js`
- Create: `backend/src/infrastructure/outbox/cleanup.js`
- Create: `backend/src/worker.js`
- Create: `backend/test/integration/outbox-publisher.test.js`
- Create: `backend/test/integration/idempotent-consumer.test.js`
- Create: `backend/test/resilience/rabbitmq-outage.test.js`
- Create: `backend/test/resilience/worker-redelivery.test.js`

**Interfaces:**
- Produces: `connectBroker(url)`, `declareTopology(channel)`, `publishOutboxBatch({ owner, leaseMs, limit })`, `consumeEvent(queue, handler)`, and `startWorker(deps)`.

- [ ] **Step 1: Write failing confirm/order/retry tests**

Cover publisher-confirm success/failure, lease expiry, duplicate event ID, stale aggregate version, version gap retry, bounded exponential retry, DLQ routing, broker outage catch-up, and worker death before acknowledgement.

- [ ] **Step 2: Verify tests fail**

Run: `cd backend && npm test -- test/integration/outbox-publisher.test.js test/integration/idempotent-consumer.test.js test/resilience/rabbitmq-outage.test.js test/resilience/worker-redelivery.test.js`

- [ ] **Step 3: Implement durable topology and workers**

Declare durable topic exchange, per-purpose durable queues, retry queues with TTL/dead-letter routing, DLQs, persistent messages, manual acknowledgements, bounded prefetch, publisher confirms, 30-day outbox cleanup, and 90-day processed-event cleanup.

- [ ] **Step 4: Verify outage, replay, and DLQ redrive**

Run all Task 6 tests against the Compose RabbitMQ service; delete/recreate the broker volume in the dedicated disposable-test stack, replay retained outbox rows, and verify one side effect.

- [ ] **Step 5: Commit**

```bash
git add backend/src backend/test deploy
git commit -m "feat(events): add transactional outbox workers"
```

### Task 7: Authentication and production security

**Files:**
- Create: `backend/src/models/refresh-token.model.js`
- Create: `backend/src/modules/identity/token.service.js`
- Create: `backend/src/middlewares/security.middleware.js`
- Create: `backend/src/middlewares/upload-policy.middleware.js`
- Modify: `backend/src/controllers/user.controller.js`
- Modify: `backend/src/middlewares/auth.middleware.js`
- Delete: `backend/src/middlewares/token.middleware.js`
- Modify: `backend/src/routes/user.route.js`
- Modify: `frontend/src/api/clients/private.client.js`
- Modify: `frontend/src/contexts/AuthContext.jsx`
- Create: `backend/test/security/auth.test.js`
- Create: `backend/test/security/webhook.test.js`
- Create: `backend/test/security/upload.test.js`

**Interfaces:**
- Produces: 15-minute access JWT, rotating opaque refresh cookie, `POST /api/v1/user/refresh`, `POST /api/v1/user/logout`, one canonical `verifyToken`, role guards, upload policy, and provider webhook verification.

- [ ] **Step 1: Write authentication abuse tests**

Test expired access tokens, refresh rotation, old-token reuse revoking the family, logout, CSRF-resistant cookie attributes, role denial, fake/timestamp-expired/duplicate webhooks, HTML/NoSQL payloads, and invalid MIME/size/count uploads.

- [ ] **Step 2: Verify security tests fail**

Run: `cd backend && npm test -- test/security`

- [ ] **Step 3: Implement the token and request security model**

Store only SHA-256 refresh-token hashes, bind tokens to a family, rotate atomically, detect reuse, set `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/user`, allow exact production origins, configure Helmet/CSP and payload limits, redact sensitive fields, and use one auth middleware.

- [ ] **Step 4: Update the frontend session flow**

Keep access tokens in memory, use `withCredentials`, serialize one refresh attempt after 401, retry the original request once, and redirect to sign-in after refresh failure. Do not persist access/refresh tokens in localStorage/sessionStorage.

- [ ] **Step 5: Run security verification**

Run: `cd backend && npm test -- test/security`
Run: `cd frontend && npm run build`
Run: `npm audit --omit=dev --audit-level=high` in both packages.

- [ ] **Step 6: Commit**

```bash
git add backend frontend
git commit -m "feat(security): rotate sessions and harden APIs"
```

### Task 8: Metrics, tracing, load, resilience, and E2E evidence

**Files:**
- Create: `backend/src/infrastructure/observability/metrics.js`
- Create: `backend/src/infrastructure/observability/tracing.js`
- Create: `deploy/otel/collector.yml`
- Create: `tests/load/http.js`
- Create: `tests/load/websocket.js`
- Create: `tests/load/seed.mjs`
- Create: `tests/e2e/playwright.config.js`
- Create: `tests/e2e/core-flows.spec.js`
- Create: `docs/system-design/load-test-results.md`
- Modify: `backend/src/app.js`
- Modify: `backend/src/server.js`

**Interfaces:**
- Produces: `/metrics`, HTTP RED metrics, WebSocket/queue/dependency metrics, trace/correlation propagation, deterministic seed command, and reproducible k6/Playwright profiles.

- [ ] **Step 1: Write observability contract tests**

Assert metric names/labels are bounded, request IDs propagate into outbox/event logs, telemetry exporter failure does not fail requests, and `/metrics` is not publicly exposed without operator authentication/network restriction.

- [ ] **Step 2: Implement instrumentation and test profiles**

Use histograms for HTTP and message acknowledgement latency, gauges for WebSockets/queue depth/dependency health, counters for errors/retries/DLQ, W3C trace context, and the exact dataset/mix/ramp/duration defined in Section 11 of the design.

- [ ] **Step 3: Run functional and resilience suites**

Run: `cd backend && npm test`
Run: `npx playwright test -c tests/e2e/playwright.config.js`
Run: the Redis, RabbitMQ, worker, and API-replica failure drills in a disposable stack.

- [ ] **Step 4: Run and record load evidence**

Run: `k6 run tests/load/http.js`
Run: `k6 run tests/load/websocket.js`
Record host size, Git SHA, dataset, latency percentiles, errors, restarts, and queue growth. If a gate fails, mark it failed and preserve the measurements.

- [ ] **Step 5: Commit**

```bash
git add backend deploy/otel tests docs/system-design/load-test-results.md
git commit -m "feat(observability): measure production SLOs"
```

### Task 9: CI, immutable images, rolling CD, and rollback

**Files:**
- Replace: `.github/workflows/backend.yml`
- Replace: `.github/workflows/frontend.yml`
- Create: `.github/workflows/production.yml`
- Create: `.github/dependabot.yml`
- Create: `deploy/scripts/deploy.sh`
- Create: `deploy/scripts/rollback.sh`
- Create: `deploy/scripts/render-upstream.sh`
- Create: `deploy/scripts/bootstrap-host.sh`
- Create: `tests/deploy/deploy-script.test.mjs`
- Modify: `deploy/compose.prod.yml`
- Modify: `docs/system-design/operations-runbook.md`

**Interfaces:**
- Consumes: GHCR image `${GITHUB_REPOSITORY}/api:${GITHUB_SHA}`, protected `production` Environment, restricted SSH secret, health endpoints, and two stable API slots.
- Produces: concurrency-locked CI/CD, deployment metadata, automatic slot rollback, and manual SHA rollback.

- [ ] **Step 1: Write deployment-script contract tests**

Use command fakes to assert `flock`, exact SHA validation, inactive-slot removal, `nginx -t`, atomic reload, drain, image pull/recreate, readiness polling, smoke checks, prior-SHA rollback, second-slot deployment, and final metadata write. Assert no `latest` tag is deployable.

- [ ] **Step 2: Verify deployment tests fail**

Run: `node tests/deploy/deploy-script.test.mjs`

- [ ] **Step 3: Implement CI quality and image pipeline**

On pull requests run lockfile installs, backend tests/coverage, frontend build and lint baseline, docs/topology tests, CodeQL, Gitleaks, dependency audit, Trivy, and image build. On `main`, push API/worker images once with SHA tags and attest provenance.

- [ ] **Step 4: Implement protected rolling production deployment**

The `production` job requires GitHub Environment approval, uses a restricted deploy key, transfers only release metadata/scripts, calls `deploy.sh <sha>`, and runs a remote post-deploy smoke test. GitHub `concurrency` plus server `flock` prevents overlapping releases.

- [ ] **Step 5: Exercise success, failure, and rollback on a disposable VPS/VM**

Deploy a healthy SHA, inject a readiness failure into the next SHA, prove traffic remains on/restores the previous SHA, then manually rollback by SHA. Record commands and timestamps in the runbook.

- [ ] **Step 6: Commit**

```bash
git add .github deploy tests/deploy docs/system-design/operations-runbook.md
git commit -m "ci: add health-gated production delivery"
```

### Task 10: Final codebase audit and portfolio handoff

**Files:**
- Create: `docs/system-design/codebase-audit.md`
- Create: `docs/system-design/known-debt.md`
- Create: `docs/system-design/portfolio-evidence.md`
- Modify: `README.md`
- Modify: `docs/system-design/acceptance-traceability.md`

**Interfaces:**
- Consumes: fresh build/test/scan/deploy/load evidence from Tasks 1–9.
- Produces: evidence-backed project claims, reproducible startup/deployment commands, and a prioritized debt register.

- [ ] **Step 1: Audit tracked files, dependencies, code, and operations**

Search for secrets, debug logs, duplicate dependencies/middleware/routes, unsafe CORS/auth, unbounded queries/uploads, hard-coded URLs, missing awaits, swallowed errors, missing indexes, large modules, stale files, dependency vulnerabilities, and docs/runtime drift. Record severity, path/line, impact, and recommended fix.

- [ ] **Step 2: Run the clean-clone acceptance suite**

From a clean worktree run lockfile installs, backend tests/coverage, frontend build/lint baseline, docs/topology/deploy tests, Compose validation/start/smoke, secret/dependency/container scans, and acceptance traceability review.

- [ ] **Step 3: Update evidence and CV-safe claims**

Only claim implemented behavior with a Git SHA and command/result. Label unavailable external steps (VPS credentials, DNS, Cloudflare, Atlas restore) as blocked with exact operator action; never call them deployed.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/system-design
git commit -m "docs: add production evidence and audit"
```

- [ ] **Step 5: Final verification and push**

Run all acceptance commands again, confirm `git diff --check`, inspect `git status`, and push the implementation branch only after every local gate is recorded.
