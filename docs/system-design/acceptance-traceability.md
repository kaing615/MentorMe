# Acceptance Traceability

**Implementation status:** Mixed

| Criterion | Implementation | Verification | Status |
| --- | --- | --- | --- |
| Nginx balances two APIs | Production Compose and upstream slots | Topology contract, replica termination test | Planned |
| Cross-replica realtime | Redis adapter and JWT socket auth | Two-server Socket.IO integration test | Planned |
| Redis degradation | Cache/limiter/lock fallbacks | Redis outage test | Planned |
| Broker recovery | Transactional outbox and confirmed publisher | RabbitMQ outage/replay test | Planned |
| Booking/payment dedupe | Transactions, state machines, unique indexes | Race and duplicate webhook tests | Planned |
| 100 RPS and 200 sockets | Reproducible k6 suites | SHA-linked result report | Planned |
| Immutable CI images | GHCR SHA workflow and scans | Workflow/image provenance evidence | Planned |
| Health-gated CD/rollback | Protected rolling deploy script | Forced readiness-failure drill | Planned |
| Backup/restore | Atlas and clean-host runbooks | Monthly timed restore evidence | Planned |
| No committed/logged secrets | Ignore rules, redaction, Gitleaks | CI and tracked-file scan | Planned |
| Editable system diagrams | Draw.io sources | Structural XML validation | Implemented |

Statuses change only with a linked command result, CI run, or deployment drill.
