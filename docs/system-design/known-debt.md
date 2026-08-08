# Known Debt

**Implementation status:** Mixed

| Priority | Debt | Exit criterion |
| --- | --- | --- |
| P0 | No disposable Docker verification run | Compose builds, all services become healthy, smoke reaches both replica IDs, and failure drills pass. |
| P0 | Background consumers have no product side-effect handlers | Email/notification handlers are idempotent, tested on redelivery, and observable through success/retry/DLQ metrics. |
| P0 | Authenticated frontend calls are not yet all routed through one refresh coordinator | Every protected API module uses one client; expiry E2E proves one refresh and one retry. |
| P0 | Unfinished Stripe/manual/admin payment paths | Routes are disabled in production or provider signatures and RBAC abuse tests pass. |
| P1 | Existing frontend lint debt | CI baseline reaches zero errors and a documented warning budget. |
| P1 | Oversized frontend modules and bundle | Feature modules are split; p75 mobile load and bundle budgets pass. |
| P1 | Mock mentor statistics | Public API uses deterministic persisted/aggregated values. |
| P1 | Observability is not exported to retained storage | OTLP SDK, metrics scraper, dashboards, and alerts are deployed and tested. |
| P1 | Duplicate/dead routes and controller code | Route inventory has one canonical path per operation and dead handlers are removed. |
| P2 | Debug logging and mixed language/error shapes | Structured logs and a versioned error envelope are used consistently. |
| P2 | Atlas backup/restore drill is documentation-only | A timed isolated restore is recorded with counts and smoke evidence. |
