# Acceptance Traceability

**Implementation status:** Mixed

| Criterion | Implementation | Verification | Status |
| --- | --- | --- | --- |
| Nginx balances two APIs | Production Compose and upstream slots | Static topology passes; runtime replica test requires Docker | Partial |
| Cross-replica realtime | Redis adapter and JWT socket auth | Unit pass; two-server test skips without `REDIS_TEST_URL` | Partial |
| Redis degradation | Cache/limiter/lock fallbacks | Unit timeout/fallback pass; outage drill requires Docker | Partial |
| Broker recovery | Transactional outbox and confirmed publisher | Contract tests pass; broker outage/replay requires Docker | Partial |
| Booking/payment dedupe | Transactions, state machines, unique indexes | Unit pass; real replica-set race test requires `MONGO_TEST_URL` | Partial |
| 100 RPS and 200 sockets | Reproducible k6 suites | Profiles implemented; no measured result | Partial |
| Immutable CI images | GHCR SHA workflow and provenance | Workflow actionlint passes; no remote run/image digest yet | Partial |
| Health-gated CD/rollback | Protected rolling deploy script | Dry-run behavior passes; disposable VPS failure drill unavailable | Partial |
| Backup/restore | Atlas and clean-host runbooks | Monthly timed restore evidence | Planned |
| No committed/logged secrets | Ignore rules and structured logger redaction | Production dependency audit passes; dedicated secret scan not yet run | Partial |
| Editable system diagrams | Draw.io sources | Structural XML validation | Implemented |

Statuses change only with a linked command result, CI run, or deployment drill.
