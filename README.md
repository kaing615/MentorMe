# MentorMe

MentorMe is a full-stack mentoring platform for mentor discovery, profile management, course purchase, consultation scheduling, reviews, notifications, and realtime chat.

## Architecture

The production target is a cost-conscious scaled modular monolith:

```text
Browser → Cloudflare CDN/Pages → Nginx API gateway → Express API A/B
                                                ├→ MongoDB Atlas
                                                ├→ Redis
                                                └→ Transactional outbox → RabbitMQ → Worker
```

The repository includes editable Draw.io diagrams, ADRs, consistency/security analysis, quality attributes, UML/domain views, testing strategy, operational runbooks, and acceptance traceability in [docs/system-design](docs/system-design/README.md).

## Implemented engineering features

- React 19/Vite frontend and Express 5/Mongoose backend
- Email verification and JWT authentication with rotating opaque refresh cookies
- Mentor/mentee profiles, course/cart/order/payment, booking, reviews, help requests, and chat
- MongoDB transactions, state machines, durable idempotency, and transactional outbox
- Redis cache versioning, distributed rate limits/locks, and Socket.IO adapter
- RabbitMQ publisher confirms, consumer deduplication, retry, DLQ, and worker process
- Nginx TLS/WebSocket proxy with two health-checked API slots
- Prometheus metrics, request IDs, W3C trace propagation, k6 profiles
- GitHub Actions CI, immutable GHCR image publishing, protected rolling CD, and SHA rollback

Public deployment and performance/outage claims are intentionally not made until the external drills listed in [portfolio evidence](docs/system-design/portfolio-evidence.md) have run.

## Local development

Requirements: Node.js 22 and a MongoDB instance. Redis and RabbitMQ are optional in development.

```bash
git clone https://github.com/kaing615/MentorMe.git
cd MentorMe

cd backend
cp .env.example .env
npm ci
npm run dev
```

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Development defaults use `http://localhost:5173` and `http://localhost:4000`; production rejects missing URLs and weak secrets.

## Verification

```bash
cd backend && npm test
cd ../frontend && npm test && npm run lint:ci && npm run build
cd ..
node scripts/verify-docs.mjs
node scripts/validate-drawio.mjs
node tests/deploy/compose.test.mjs
node tests/deploy/deploy-script.test.mjs
```

The frontend lint command enforces the committed legacy-debt ceiling. It is a regression gate, not a claim that lint debt is zero.

## Production delivery

Production configuration lives under [deploy](deploy). Copy `deploy/env/production.env.example` to `/opt/mentorme/.env`, configure the protected GitHub `production` Environment, and follow the [operations runbook](docs/system-design/operations-runbook.md).

The delivery workflow publishes only full Git-SHA image tags. It updates one API slot at a time, polls readiness, validates/reloads Nginx, drains the old slot, runs smoke checks, writes release metadata atomically, and restores the prior SHA on failure.

## Current limitations

The authoritative findings are maintained in the [codebase audit](docs/system-design/codebase-audit.md) and [known-debt register](docs/system-design/known-debt.md). Major open items include real Docker/VPS outage drills, product side-effect consumers, one canonical frontend refresh client, lint/bundle reduction, removal of mock mentor statistics, and retained telemetry storage.

## Contribution workflow

Create a feature branch, use Conventional Commit messages, open a pull request into the integration branch, pass CI/review, and promote to `main` through a reviewed PR. Do not push directly to `main`.
