# Codebase Audit

**Implementation status:** Mixed

Audit scope: tracked backend, frontend, production topology, delivery scripts, dependencies, and architecture documentation on `feat/production-architecture` compared with `main`.

## Findings

| Severity | Location | Finding | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| High | `backend/src/infrastructure/outbox/consumer.js`, `backend/src/worker.js` | The durable worker currently acknowledges events after a logging-only handler; no email/notification side-effect handlers are registered. | The event pipeline is durable but does not yet deliver the product notifications described by the target design. | Add idempotent handlers per event type and integration-test the external side effects before claiming asynchronous notifications. |
| High | `frontend/src/api/clients/api.client.js`, `frontend/src/api/modules/*` | Several API modules still use clients that redirect immediately on 401 or create a new private client per call. Only `private.client.js` serializes refresh and retries once. | A 15-minute token expiry can terminate otherwise valid sessions on code paths that bypass the coordinated client. | Export one configured authenticated client and migrate every protected module to it. |
| High | `backend/src/controllers/course.controller.js` | The unused `handlePurchaseSuccess` export returns `coursesWithId`, which is undefined; a separate purchased-course controller owns the live route. | Re-enabling the dead handler would return 500 and duplicate purchase-grant logic. | Delete the dead handler after confirming no external imports; keep the transactional payment grant as the only ownership path. |
| High | `backend/src/controllers/payment.controller.js` | Stripe returns `demo_client_secret`; manual payment and admin payment listings are present while route files still mark admin authorization as unfinished. | Accidental exposure could create fake payment success/admin data access paths. | Disable unfinished providers/routes in production or complete provider verification and explicit admin RBAC tests. |
| Medium | `backend/src/controllers/profile.controller.js` | Top-mentor rating and student counts are random mock values. | Cached public responses present fabricated business data. | Replace with indexed aggregates or omit these fields until measured data exists. |
| Medium | `backend/src/server.js`, `/health/ready` | The API process never connects to RabbitMQ, so its RabbitMQ health flag remains down while the API returns `degraded`. | Dashboards report a permanent degradation and cannot distinguish worker health from API health. | Split API-critical readiness from worker/broker health and expose worker health independently. |
| Medium | `backend/src/infrastructure/observability`, `deploy/otel/collector.yml` | Prometheus metrics and W3C trace propagation exist, but no OpenTelemetry SDK exporter or persistent metrics backend is connected; the collector uses the debug exporter. | Correlation works locally, but distributed traces and historical dashboards are unavailable. | Add an OTLP SDK and a managed/retained telemetry backend before claiming distributed tracing. |
| Medium | `frontend/src/pages/mentor-profile.jsx` and other page modules | `mentor-profile.jsx` is about 5,700 lines; `checkout.jsx` is about 1,300 lines. | High change risk, slow review, and difficult isolated testing. | Split data hooks, forms, dialogs, and domain panels into feature modules. |
| Medium | frontend lint baseline | ESLint currently records 210 errors and 16 warnings. CI blocks regression but does not make the code clean. | Existing dead imports, hook issues, and unsafe patterns remain. | Burn down the baseline by rule/category and lower the committed ceiling in each PR. |
| Medium | frontend bundle | The production JS bundle is about 1.54 MB minified (about 444 KB gzip). | Slower mobile startup and cache churn. | Route-level lazy loading and vendor chunking; set a measured bundle budget. |
| Medium | `backend/src/routes/user.route.js` | `POST /signupMentor` is registered twice. | The second handler is unreachable/confusing and middleware behavior can diverge. | Keep one validated upload pipeline. |
| Medium | backend/frontend source | Debug `console.*` calls remain across controllers, pages, hooks, and services. | Noisy logs can expose payload metadata and bypass structured redaction. | Replace backend calls with Pino and remove frontend debug logs in production builds. |
| Low | `backend/src/swagger.yaml`, `backend/src/swagger.js`, seed utilities | Localhost defaults remain outside the validated runtime path. | Generated documentation can point at the wrong host; seed scripts may hit local Mongo unintentionally. | Drive Swagger servers and seed database URLs from the validated environment contract. |

## Fixed during audit

- Added a regression test and repaired `getRelatedCourses`, which referenced an undefined `newCourse` because create-course code had been pasted into the read handler.
- Added a regression test so the canonical auth middleware rejects unverified users.
- Dead-letter malformed broker messages instead of leaking an unhandled promise rejection.
- Removed production access-token persistence from browser storage and changed Socket.IO authentication to JWT.

## Evidence and limitations

- Backend unit/contract tests, frontend tests/build, documentation checks, topology checks, deploy dry-run behavior, shell syntax, production dependency audits, and actionlint pass locally.
- Mongo replica-set, Redis cross-replica, RabbitMQ outage/redelivery, container runtime, k6, Cloudflare, DNS, TLS, Atlas restore, and VPS rollback drills remain unverified because the Docker engine and external credentials/hosts were unavailable.
