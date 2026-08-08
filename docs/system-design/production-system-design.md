# MentorMe Production System Design

**Status:** Approved design; implementation pending
**Date:** 2026-08-08
**Target:** Cost-conscious portfolio production
**Scale:** 100 concurrent users, up to 100 API requests/second, and 100–200 concurrent WebSocket connections

## 1. Purpose

This document defines the production architecture and implementation scope for MentorMe. The goal is to turn the current full-stack application into an honest, demonstrable production system for a software-engineering portfolio without introducing infrastructure that the expected load does not justify.

The design keeps one codebase and one backend deployable while adding horizontal process scaling, shared state, asynchronous processing, production security, observability, automated deployment, and failure handling. Documentation and diagrams must always distinguish implemented behavior from target behavior.

## 2. Current State

MentorMe currently consists of:

- A React/Vite single-page application.
- One Node.js/Express process exposing REST endpoints under `/api/v1`.
- Socket.IO attached to the same HTTP server for realtime messaging.
- MongoDB accessed directly through Mongoose models.
- Direct integrations with Cloudinary, email, VNPay, MoMo, and Stripe-style payment flows.
- Route, controller, model, validation, and middleware folders organized as a modular monolith in progress.
- Swagger/OpenAPI documentation, Dockerfiles, and a local Docker Compose file.
- Two GitHub Actions workflows that install/build code on pushes to `main`.

The current repository does **not** implement continuous deployment, an API gateway, horizontal backend replicas, shared WebSocket state, Redis caching, distributed rate limiting, RabbitMQ, transactional outbox publishing, production observability, or formal system-design diagrams.

Unless a section is explicitly labeled otherwise, Sections 3–21 describe the **target implementation**, not behavior that exists in the current repository.

## 3. Architectural Decision

MentorMe will use a **scaled modular monolith** deployed to a single Linux VPS. It will not be split into microservices at the target scale.

The production topology is:

```text
Browser
 ├── Static assets ──> Cloudflare Pages/CDN
 └── HTTPS/WebSocket
          │
     Cloudflare DNS/WAF
          │
     Nginx API Gateway
     + Load Balancer
          │
    ┌─────┴─────┐
 API Replica 1  API Replica 2
    │               │
    └──────┬────────┘
       Redis + RabbitMQ
              │
          Worker Process
              │
   ┌──────────┼───────────┐
MongoDB Atlas Cloudinary  Email/Payment Providers
```

Cloudflare Pages hosts the frontend. The VPS hosts Nginx, two backend replicas, Redis, RabbitMQ, and at least one worker process through Docker Compose. MongoDB Atlas remains the durable system of record, and Cloudinary remains the media store.

Two replicas on one VPS protect against process failure but not host failure. The design therefore targets operational resilience, not infrastructure high availability. A later evolution may add a second VPS and managed load balancer without changing application interfaces.

## 4. Module Model

The backend remains one deployable composed of these domain modules:

1. Identity and Profile
2. Course Catalog and Reviews
3. Cart, Checkout, Order, and Payment
4. Availability and Booking
5. Messaging and Notifications
6. Help Requests

Each module exposes a small application interface. Other modules must not reach into its implementation or directly mutate its collections. Synchronous behavior crosses an application-command or query interface; asynchronous side effects cross a domain-event interface.

The target dependency flow is:

```text
Route Adapter
    ↓
Application Command / Query
    ↓
Domain Module
    ↓
Repository Interface
    ↓
Mongoose Adapter
```

External systems sit behind explicit seams:

- `PaymentGateway`
- `MediaStorage`
- `MessageBroker`
- `CacheStore`
- `EmailSender`
- `Clock`
- `IdGenerator`

Interfaces are introduced only where behavior varies, needs isolation from an external dependency, or requires a test adapter. The implementation must not create speculative abstraction layers.

## 5. Data Ownership and Consistency

MongoDB is the source of truth. Redis and RabbitMQ never hold the only copy of business data.

| Workflow | Consistency model |
| --- | --- |
| Booking a slot | Strong consistency |
| Checkout, order, and payment | Strong consistency plus idempotency |
| Cart mutation | Read-after-write consistency |
| Course, profile, and search caching | Eventual consistency |
| Chat delivery and read receipts | Eventual consistency |
| Email and notification delivery | At-least-once delivery |

MongoDB transactions protect multi-document invariants for booking creation/cancellation, order creation, course purchase creation, and payment confirmation. Booking uses a conditional atomic update so only one request can move a slot from available to reserved. Unique indexes remain the final guard against duplicate booking, purchase, review, order, and event-processing records.

Payment requests and webhooks carry idempotency keys. A repeated provider callback must return the existing result and must not create another order, payment, or purchased course. Durable idempotency records are stored in MongoDB with a unique `(scope, key)` index and retained for 90 days; Redis may cache completed results but is not authoritative.

### 5.1 Booking state machine

The canonical booking states remain compatible with the current model:

```text
pending ──confirm──> active ──finish──> finished
   │                    │
   ├──reject──> rejected
   ├──cancel──> cancelled
   └──expire──> cancelled (reason=expired)
```

Creating a booking runs one MongoDB transaction that conditionally changes the selected slot from `open` to `pending`, creates the booking, and inserts `booking.created` into the outbox. The conditional update matches `availabilityId`, `slotId`, and `slots.status=open`; a zero-document update means the slot was lost to another request. Confirming changes `pending` to `active` and the slot to `booked` in one transaction. Rejecting, cancelling, or expiring releases the slot and writes its event in the same transaction. A TTL-backed reservation deadline is explicit data, and an idempotent worker expires overdue pending bookings.

Required uniqueness is enforced by a partial unique index over the active reservation identity `(availabilityId, slotId)` for booking states `pending` and `active`. Overlap checks remain business validation, while the slot index is the concurrency guard.

### 5.2 Order and payment state machine

```text
pending ──start payment──> processing ──verified webhook──> paid ──grant──> completed
   │                           │                │
   ├──cancel──> cancelled      ├──timeout──> processing
   └──manual failure──> failed └──failure──> failed

paid/completed ──approved refund──> refunded
```

No MongoDB transaction remains open while calling a payment provider. Order creation commits `pending` first. Starting payment records the provider request and moves the order to `processing`; the external call occurs afterward. A verified webhook or reconciliation command then runs a new transaction that records the provider transaction ID, moves the order to `paid`, grants purchased courses with unique `(mentee, course)` protection, and inserts `payment.completed` plus `course.purchased` outbox events. A late success webhook is accepted from `processing` or a timeout-marked processing state, but not from `cancelled` or `refunded`; incompatible callbacks are quarantined for manual reconciliation.

Provider transaction IDs and `(provider, providerEventId)` are unique. Refund and cancellation races use compare-and-set state transitions. Reconciliation ownership belongs to a scheduled payment worker that queries stale `processing` orders and asks the provider for authoritative status.

## 6. Event-Driven Architecture

Business changes and event publication use the Transactional Outbox Pattern:

```text
Business transaction
    ├── Update domain data
    └── Insert outbox event
             │
       Outbox Publisher
             │
         RabbitMQ
             │
     Idempotent Worker Consumers
```

Initial domain events are:

- `user.registered`
- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `payment.completed`
- `payment.failed`
- `course.purchased`
- `message.sent`
- `notification.requested`

Each event contains `eventId`, `eventType`, `aggregateId`, `aggregateVersion`, `occurredAt`, and a versioned payload. RabbitMQ exchanges and queues are durable. Consumers use bounded retries with exponential backoff and dead-letter queues. Consumers record processed event IDs because delivery is at least once.

RabbitMQ delivery order is **not** treated as a correctness guarantee. Consumers compare `aggregateVersion` with their last applied version, ignore stale duplicates, and defer version gaps for retry. Consumers that need the latest truth reload the aggregate from MongoDB before producing a side effect. This keeps correctness independent of publisher concurrency, retries, redelivery, or queue failover.

The outbox publisher claims rows through a lease, publishes persistent messages with publisher confirms, and marks a row published only after confirmation. Published outbox rows are retained for 30 days. Consumer deduplication records are retained for 90 days. If the RabbitMQ volume is lost, operators recreate the broker and replay retained outbox rows; idempotent consumers make replay safe. DLQ redrive is an authenticated runbook action with an audit record.

Queue prefetch and bounded queue policies provide backpressure. If RabbitMQ is unavailable, the business transaction and outbox record still commit; publishing resumes when the broker recovers. RabbitMQ durability protects normal process restarts, while MongoDB outbox retention protects broker-volume loss.

## 7. Redis Responsibilities

Redis provides shared, disposable state:

- Cache-aside storage for read-heavy queries.
- Distributed rate-limit counters.
- Socket.IO adapter state across backend replicas.
- Idempotency results with bounded retention.
- Short-lived distributed locks for schedulers and duplicate background work.

Default cache policies are:

| Data | TTL |
| --- | ---: |
| Course lists and details | 5 minutes |
| Mentor profiles and search results | 2–5 minutes |
| Availability queries | 30–60 seconds |

Payment state and booking write paths are never served from cache. Mutations publish invalidation events. Redis operations have a 100 ms application timeout and reconnect with bounded exponential backoff.

When Redis fails:

- Reads bypass the cache and use MongoDB.
- Public-read limits fail open.
- Authentication and write endpoints use a per-process limiter at half the normal threshold and emit an alert; this is explicitly weaker than the distributed limit.
- Durable idempotency falls back to the MongoDB idempotency collection.
- Schedulers that require a distributed lock pause rather than risk duplicate execution.
- Cross-replica realtime delivery becomes unavailable, but durable messages remain in MongoDB and are fetched after reconnect.
- Cache reads remain bypassed until recovery; after reconnect, versioned cache namespaces prevent stale entries written before the outage from becoming visible.

Correctness never depends on a Redis lock alone.

## 8. Gateway, Proxies, and Protocols

Cloudflare handles DNS, CDN delivery, edge TLS, and WAF rules. Nginx is the origin reverse proxy, API gateway, and load balancer.

Nginx is responsible for:

- Routing `/api/*` and `/socket.io/*`.
- Load balancing between backend replicas.
- WebSocket upgrade headers.
- Cloudflare Full (Strict) TLS with an origin certificate terminated by Nginx.
- Request IDs, body-size limits, timeouts, compression, and security headers.
- Basic edge throttling before distributed application rate limiting.

| Connection | Protocol |
| --- | --- |
| Browser to Cloudflare/Nginx | HTTPS over HTTP/2 |
| Realtime messaging | WSS / Socket.IO |
| Nginx to backend replicas | Private HTTP |
| Backend/worker to RabbitMQ | AMQP on the private Docker network |
| Backend to Redis | RESP/TCP on the private Docker network |
| Backend to MongoDB Atlas | MongoDB Wire Protocol over TLS |
| Payment provider to backend | HTTPS webhook with provider signature |

Socket.IO uses the Redis adapter so either replica can publish to any connected user. Production clients use WebSocket-only transport, which avoids long-polling affinity requirements; loss of WebSocket connectivity is handled as an explicit degraded state instead of silently switching transports.

## 9. Rate Limiting

Default limits are configurable by environment:

- Sign-in and sign-up: 5 requests/minute/IP.
- Public reads: 60 requests/minute/IP.
- Authenticated writes: 30 requests/minute/user.
- WebSocket connections: 10 attempts/minute/IP.
- Chat messages: 20 messages/10 seconds/user.

The application-level limiter stores counters in Redis so limits remain consistent across replicas. Payment webhooks rely primarily on signature verification, replay protection, and idempotency rather than ordinary user-facing limits.

## 10. Security Design

Authentication moves from long-lived browser storage to:

- A 15-minute access token held in memory.
- A rotating refresh token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Server-side refresh-token revocation and reuse detection.
- RBAC for mentee, mentor, and administrator roles.

Additional controls include:

- Explicit production CORS allowlists.
- Helmet and a tested Content Security Policy.
- Joi validation and normalization at the request seam.
- HTML sanitization and NoSQL-injection defenses.
- File MIME, extension, count, and size limits.
- Bcrypt password hashing.
- Provider webhook signature, timestamp, and replay validation.
- Redis and RabbitMQ private networking with authentication and no public ports.
- Atlas IP allowlisting and TLS.
- Secrets supplied by GitHub and host secret stores, never committed or logged.
- UFW exposing only SSH, HTTP, and HTTPS.
- SSH keys only, disabled password login, and disabled direct root login.
- Dependency, secret, static-analysis, container, and dynamic security scans in CI.

Production errors return stable error codes without stack traces. Logs redact tokens, passwords, cookies, and payment secrets.

## 11. Quality Attributes

| Attribute | Target |
| --- | ---: |
| Concurrent users | 100 |
| API throughput | 100 requests/second |
| Concurrent WebSockets | 100–200 |
| Read latency p95 | Under 300 ms |
| Write latency p95 | Under 500 ms |
| WebSocket delivery p95 | Under 200 ms |
| Availability | 99.5% target |
| Recovery Point Objective | 24 hours |
| Recovery Time Objective | 60 minutes |

These are verification targets, not claims. The published portfolio documentation records measured k6 and WebSocket load-test results.

The reproducible HTTP load profile runs against the Nginx origin on the production-sized VPS with a seeded dataset of 10,000 users, 1,000 courses, 10,000 bookings, and 100,000 messages. It ramps from 0 to 100 requests/second over 2 minutes and sustains 100 requests/second for 10 minutes with this mix: 60% course/profile/search reads, 20% authenticated cart/profile reads, 10% availability reads, 5% booking/order writes, and 5% message-history requests. The gate requires under 1% unexpected errors, read p95 under 300 ms, write p95 under 500 ms, no container restart, and no unbounded queue growth.

The WebSocket profile ramps to 200 authenticated connections over 5 minutes, sustains them for 15 minutes, and sends one message per active client every 5 seconds. The gate requires zero lost durable messages, under 1% connection failures, and message-delivery p95 under 200 ms measured from server acknowledgement to receiver event inside the VPS region.

Availability is measured by an external one-minute probe over a rolling calendar month at the public frontend, core API health endpoint, and WebSocket handshake. Planned maintenance counts against the 99.5% objective. Cloudflare, VPS, Atlas, and application outages count when they make the core system unreachable; optional payment/email provider failures count against their feature metric but not core API availability. A 30-day month therefore has an error budget of approximately 3 hours 36 minutes.

The 24-hour RPO relies on Atlas Flex daily backups. The 60-minute RTO is accepted only after a clean-VPS restore drill uses version-controlled bootstrap instructions, restores environment secrets from the operator store, starts the production Compose stack, restores/verifies Atlas data, and passes smoke tests within 60 minutes.

Scalability comes from stateless API replicas, separately scalable workers, shared realtime state, external durable storage, bounded queues, pagination, indexes, and CDN delivery. The first infrastructure scaling step is a larger VPS; the next is a second VPS behind a managed load balancer.

Reliability mechanisms include liveness/readiness probes, graceful shutdown, Docker restart policies, connection timeouts, bounded retries with jitter, circuit breakers around external providers, dead-letter queues, correlation IDs, and restore/rollback runbooks.

### 11.1 Production resource envelope

The minimum recommended production host is a Linux VPS with 2 dedicated or high-performance vCPU, 4 GB RAM, 80 GB SSD storage, and at least 2 TB monthly transfer. The host keeps at least 20% memory and disk headroom during the load profile. It is not valid to publish the 100 requests/second target from a smaller host without recording the changed hardware and measured result.

Initial container memory budgets are Nginx 128 MB, each API replica 512 MB, worker 384 MB, Redis 384 MB with an eviction policy and bounded maximum memory, RabbitMQ 768 MB with queue limits, and OpenTelemetry Collector 256 MB. Docker and the operating system retain the remaining memory. CPU limits prevent a worker or broker backlog from starving Nginx and both API replicas; exact limits are tuned from load-test evidence and committed with the Compose file.

Production disk alerts fire at 70% and become critical at 85%. RabbitMQ queue length and byte limits, Redis `maxmemory`, Docker log rotation, and 30-day outbox retention prevent unbounded local growth. One API replica must sustain the acceptance load during a rolling deployment; if it cannot, the deployment pauses and the host must be resized before CD is enabled.

### 11.2 Explicit scaling and extraction triggers

Scaling decisions use sustained measurements over at least three representative peak windows, not a single spike:

- Resize the VPS when CPU is above 70%, memory above 75%, disk latency causes the API latency SLO to fail, or one replica cannot serve the release load profile with 20% headroom.
- Add a second VPS and managed load balancer when the 99.5% objective is repeatedly missed because of host maintenance/failure, peak traffic exceeds one host after vertical scaling, or zero-downtime host maintenance becomes a business requirement.
- Move Redis or RabbitMQ to a managed service when broker/cache memory competes with the API, recovery drills exceed the 60-minute RTO, queue durability requires independent failure isolation, or operator effort exceeds the cost of the managed tier.
- Extract a domain module into an independently deployable service only when it needs a different scaling profile, release cadence, security boundary, or ownership team and its measured coupling has already been reduced to a stable command/query/event interface.
- Introduce an orchestrator such as Kubernetes only after at least three hosts or several independently deployable services make Compose deployment, scheduling, health replacement, and secrets management demonstrably operationally expensive. Kubernetes is not triggered by traffic volume alone.

## 12. Performance and Cost Optimization

- Cloudflare caches static frontend assets.
- Redis reduces repeated read-heavy MongoDB queries.
- MongoDB compound indexes follow measured query patterns.
- List endpoints require bounded pagination.
- Mongoose population is explicitly bounded.
- Nginx enables safe compression and connection reuse.
- MongoDB, Redis, and RabbitMQ use connection pools.
- Slow side effects run in workers.
- The frontend uses route-level lazy loading and bundle splitting.
- Docker containers receive CPU and memory limits.

The design avoids Kubernetes, independent microservice deployments, and a self-hosted observability stack on the small VPS. Frontend hosting remains free, the VPS is the main compute cost, and Atlas Flex provides managed durability and backups.

## 13. Design Patterns and Principles

The implementation uses patterns only where they improve locality, testability, or failure handling:

- Adapter for infrastructure providers.
- Strategy for payment providers.
- Repository for persistence seams.
- Unit of Work for MongoDB transactions.
- Transactional Outbox for database/event coordination.
- Idempotent Consumer for at-least-once events.
- Cache-Aside for read caching.
- Circuit Breaker for unstable external providers.
- Dependency Injection for replaceable test adapters.
- Explicit State Machines for booking, order, and payment transitions.

Core principles are separation of concerns, explicit ownership, small interfaces, dependency inversion at infrastructure seams, immutable events, idempotency, bounded work, graceful degradation, defense in depth, and measured rather than speculative scaling.

## 14. Testing Strategy

The test portfolio includes:

- Unit tests for domain rules, calculations, and state transitions.
- Integration tests for MongoDB, Redis, RabbitMQ, repositories, and outbox publication.
- OpenAPI contract validation.
- Supertest coverage for HTTP behavior.
- Socket.IO integration tests for connect, send, delivery, read, disconnect, and reconnect flows across replicas.
- Playwright end-to-end tests for registration, booking, checkout, and messaging.
- k6 HTTP load tests for the 100 requests/second target.
- WebSocket load tests for 100–200 simultaneous connections.
- Security checks using dependency audit, secret scanning, static analysis, Trivy, and OWASP ZAP.
- Resilience tests for duplicate webhooks, Redis outage, RabbitMQ outage, worker crash, and API replica termination.

New domain and application modules target at least 80% coverage. Legacy code receives a measured baseline and a ratcheting threshold. Existing lint debt is baselined; CI blocks new lint violations without pretending the current tree is already clean.

## 15. Observability

The application emits:

- Structured JSON logs through Pino.
- Correlation IDs across HTTP requests, events, and worker jobs.
- RED metrics: request rate, errors, and duration.
- WebSocket connection and delivery metrics.
- Queue depth, retry, consumer lag, and dead-letter metrics.
- MongoDB, Redis, and RabbitMQ connection metrics.
- OpenTelemetry traces.
- `/health/live`, `/health/ready`, and `/metrics` endpoints.

Alerts cover elevated error rate, latency, queue depth, dead-letter growth, dependency disconnection, disk pressure, and failed backups. An OpenTelemetry Collector exports metrics, traces, and logs to Grafana Cloud; stdout and the Prometheus-compatible `/metrics` endpoint remain local fallbacks. The production VPS does not run a heavy Grafana stack.

## 16. Distributed Failure Behavior

| Failure | Expected behavior |
| --- | --- |
| One API replica exits | Nginx routes traffic to the healthy replica |
| Redis unavailable | Database reads continue; cache and cross-replica realtime degrade |
| RabbitMQ unavailable | Business writes and outbox entries continue; publishing catches up later |
| Worker crashes mid-job | Unacknowledged message is redelivered; consumer remains idempotent |
| Payment provider times out | Payment remains pending and is reconciled later |
| Duplicate payment webhook | Existing idempotent result is returned |
| MongoDB unavailable | Readiness fails and writes stop; no false success is returned |
| VPS unavailable | Application is unavailable until VPS recovery or restore |

## 17. Continuous Delivery

The current repository has CI only. The target adds continuous delivery from `main`:

```text
Merge to main
   ↓
Lint, unit, integration, and contract tests
   ↓
SAST, secret, dependency, and container scans
   ↓
Build immutable Docker images
   ↓
Push images to GHCR with Git SHA tags
   ↓
Deploy inactive backend replica
   ↓
Readiness and smoke checks
   ↓
Switch Nginx traffic
   ↓
Deploy remaining replica
   ↓
Post-deploy smoke test
```

Each release is identified by Git SHA. GitHub Actions builds the images once, pushes immutable SHA tags to GHCR, and deploys only those tags. The production job uses a protected GitHub Environment and a restricted VPS deploy account. A server-side `flock` serializes deployments.

The Compose topology uses stable `api-a` and `api-b` slots exposed only on loopback ports `4001` and `4002`. To update a slot, the deploy script removes it from the generated Nginx upstream, validates and atomically reloads Nginx, waits for graceful connection drain, replaces the container with the new SHA image, polls readiness on its loopback port, adds it back, and reloads Nginx again. It then repeats for the other slot. Normal operation load-balances across both slots; an update temporarily runs on one slot, so VPS resource planning must keep one slot capable of the target load.

Nginx changes use a generated temporary file followed by `nginx -t` and an atomic rename/reload. Backend shutdown stops accepting new work, closes HTTP/WebSocket connections within a bounded drain period, and lets in-flight requests finish. A failed readiness or smoke test restores the previous SHA for the affected slot before traffic returns.

Database changes follow expand/contract migration: release N adds backward-compatible fields/indexes, application versions N and N+1 work with both schemas, and destructive cleanup occurs in a later release only after rollback compatibility expires. A migration failure stops deployment before switching traffic. Image rollback never claims to reverse data migrations.

## 18. UML and Architecture Deliverables

The implementation produces editable Draw.io sources and exported PNG/SVG files for:

1. C4 System Context.
2. C4 Container and deployment topology.
3. Backend module relationships.
4. Domain ERD.
5. UML class diagram for booking, order, and payment.
6. Booking sequence diagram.
7. Payment plus outbox sequence diagram.
8. Cross-replica WebSocket messaging sequence diagram.
9. Booking/order/payment state machines.
10. CI/CD deployment flow.

Expected documentation layout:

```text
docs/
├── system-design/
│   ├── README.md
│   ├── current-architecture.md
│   ├── target-architecture.md
│   ├── quality-attributes.md
│   ├── consistency-and-events.md
│   ├── security.md
│   ├── testing-strategy.md
│   └── operations-runbook.md
├── diagrams/
│   ├── mentorme-c4.drawio
│   ├── mentorme-domain.drawio
│   ├── mentorme-flows.drawio
│   └── exported PNG/SVG files
└── adr/
    ├── 0001-scaled-modular-monolith.md
    ├── 0002-redis-shared-state.md
    ├── 0003-rabbitmq-outbox.md
    └── 0004-single-vps-deployment.md
```

## 19. Implementation Phases

Each phase must be independently reviewable and keep the application runnable. Infrastructure modules are integrated into real workflows; placeholder containers or diagrams alone do not satisfy a phase. A phase advances only when its tests and exit gate pass. Its rollback gate defines the last known-safe point and must be exercised before production promotion.

### Phase 1: Architecture baseline

- **Prerequisite:** approved production-system design.
- **Deliverables:** system-design documents, editable/exported diagrams, ADRs, current-state inventory, and an implementation traceability matrix.
- **Tests:** diagram validation/export, Markdown link checks, placeholder/contradiction scan, and implementation-status label review.
- **Exit gate:** every acceptance criterion maps to a later implementation task and all future behavior is labeled as target behavior.
- **Rollback gate:** documentation-only commit can be reverted without runtime impact.

### Phase 2: Application and test foundation

- **Prerequisite:** Phase 1 exit gate.
- **Deliverables:** validated environment configuration, removal of hard-coded production URLs, liveness/readiness endpoints, graceful shutdown, structured logging, correlation IDs, and unit/integration test harnesses.
- **Tests:** backend unit and Supertest smoke tests, frontend build, configuration failure tests, signal/drain tests, and legacy lint baseline.
- **Exit gate:** existing user flows still build and start; health endpoints distinguish process health from dependency readiness.
- **Rollback gate:** old runtime entrypoint remains deployable until the new entrypoint passes smoke tests.

### Phase 3: Domain consistency and durable idempotency

- **Prerequisite:** transaction-capable MongoDB test environment and Phase 2 harness.
- **Deliverables:** explicit booking/order/payment transition services, MongoDB transaction boundaries, conditional slot reservation, required unique indexes, durable idempotency records, and outbox writes inside the same business transactions.
- **Tests:** state-transition unit tests, concurrent booking integration tests, duplicate webhook/order tests, transaction rollback tests, and index migration tests.
- **Exit gate:** duplicate and conflicting operations preserve every documented invariant and outbox rows are committed atomically with business state.
- **Rollback gate:** expand-only schema/index migrations remain compatible with the prior application image; destructive cleanup is prohibited.

### Phase 4: Production topology

- **Prerequisite:** Phase 2 health/drain behavior and the resource envelope in Section 11.1.
- **Deliverables:** production Docker images and Compose stack, Nginx gateway, two API slots, worker entrypoint, private networks, resource/log limits, and local production smoke scripts.
- **Tests:** image health checks, Nginx config validation, replica termination/drain test, private-port inspection, and one-replica load gate.
- **Exit gate:** Nginx serves two replicas, survives loss of either replica, and the host keeps required headroom.
- **Rollback gate:** previous SHA images and Compose configuration can be restored without a data migration rollback.

### Phase 5: Redis shared state

- **Prerequisite:** two healthy API replicas from Phase 4.
- **Deliverables:** cache-aside adapter, invalidation, distributed rate limiting, Socket.IO Redis adapter, bounded idempotency cache, and scheduler locks.
- **Tests:** cache hit/miss/invalidation tests, cross-replica messaging test, rate-limit consistency test, and Redis outage/recovery test.
- **Exit gate:** shared behavior works across replicas and every Section 7 degradation rule is demonstrated.
- **Rollback gate:** Redis features can be disabled by configuration while MongoDB remains authoritative.

### Phase 6: RabbitMQ and transactional outbox delivery

- **Prerequisite:** Phase 3 transactional outbox writes and Phase 4 worker runtime.
- **Deliverables:** broker adapter, leased publisher with confirms, durable exchanges/queues, version-aware idempotent consumers, retry/DLQ policies, retention cleanup, and redrive/replay runbooks.
- **Tests:** publish-confirm integration test, duplicate/out-of-order/gap tests, broker outage catch-up, worker-crash redelivery, DLQ/redrive, and retained-outbox replay.
- **Exit gate:** committed business operations survive broker loss and eventually produce each intended side effect without duplicates.
- **Rollback gate:** consumers and publisher can be stopped without blocking synchronous business writes; retained outbox rows allow later replay.

### Phase 7: Security hardening

- **Prerequisite:** stable application seams from Phases 2–6.
- **Deliverables:** access/refresh-token rotation, revocation/reuse detection, RBAC, strict CORS/CSP, request and upload controls, webhook verification/replay protection, secret handling, redaction, and host hardening guide.
- **Tests:** authentication/authorization integration tests, malicious payload/upload tests, webhook forgery/replay tests, secret scan, dependency/SAST/container scans, and ZAP baseline.
- **Exit gate:** no critical/high unresolved production finding and all sensitive endpoints have explicit negative tests.
- **Rollback gate:** token migration supports a bounded compatibility window; security controls are never silently disabled to complete a deployment.

### Phase 8: Observability and production verification

- **Prerequisite:** production topology and all runtime dependencies.
- **Deliverables:** metrics, traces, dashboards/alerts, backup/restore and incident runbooks, seeded load data, HTTP/WebSocket load suites, E2E suites, and resilience drills.
- **Tests:** the exact profiles in Section 11, alert tests, duplicate/failure drills, Atlas restore drill, and correlation propagation checks.
- **Exit gate:** measured results and drill timestamps are recorded; unmet SLOs are reported as gaps rather than claims.
- **Rollback gate:** telemetry export failure cannot break request processing, and load/security tests never target production without an explicit safe-test flag.

### Phase 9: Continuous delivery and VPS deployment

- **Prerequisite:** all earlier phase gates, a provisioned VPS, GHCR access, protected GitHub Environment approval, and stored production secrets.
- **Deliverables:** CI quality/scanning workflow, immutable SHA image publication, restricted SSH deployment, serialized rolling script, Nginx traffic drain/switch, smoke checks, release metadata, and SHA rollback.
- **Tests:** workflow lint, image provenance/scan, staging or disposable-host deployment, forced readiness failure rollback, concurrent-deploy lock test, and post-deploy smoke test.
- **Exit gate:** an approved merge to `main` deploys the exact tested SHA and a deliberately bad release automatically returns to the prior healthy SHA.
- **Rollback gate:** operators can stop automation, drain a slot, and restore the previous image; expand/contract data rules remain in force.

### Phase 10: Final codebase audit and portfolio handoff

- **Prerequisite:** CD deployment evidence or a documented external-access blocker.
- **Deliverables:** code-quality/security/reliability audit, known-debt register, measured architecture README, deployment/restore demo instructions, and CV-safe claims backed by evidence.
- **Tests:** clean-clone build/start, full automated suite, docs/link checks, secret scan, tracked-file inspection, and acceptance-criteria traceability review.
- **Exit gate:** every criterion is marked implemented and evidenced, intentionally deferred with rationale, or blocked by a named external dependency.
- **Rollback gate:** audit/documentation commits do not change production behavior; any audit-driven runtime fix repeats its owning phase gate.

## 20. Acceptance Criteria

- Nginx distributes traffic across two healthy API replicas.
- Realtime messaging works when sender and receiver connect to different replicas.
- Redis failure follows the documented degraded behavior without corrupting durable state.
- RabbitMQ failure leaves recoverable outbox records and resumes delivery after recovery.
- Duplicate booking attempts and payment webhooks do not create duplicate durable records.
- Measured load results cover 100 requests/second and 100–200 concurrent WebSockets.
- CI builds, tests, and scans immutable images.
- CD deploys and rolls back releases by Git SHA through production approval and health gates.
- Daily backup and monthly restore procedures are documented and exercised.
- Security-sensitive data is not committed or logged.
- Diagrams and documentation match the implementation and label future evolution explicitly.

## 21. Trade-offs and Non-Goals

- A single VPS is accepted as a cost-driven single point of failure.
- Redis and RabbitMQ on the same VPS improve process architecture but not host-level availability.
- MongoDB Atlas is preferred over self-hosting MongoDB to reduce data-loss and maintenance risk.
- Kubernetes, multi-region active-active deployment, independent microservices, service mesh, distributed SQL, and global event streaming are outside the target scope.
- The design optimizes for an honest portfolio system and a clear future scaling path, not artificial infrastructure complexity.
