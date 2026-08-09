# Testing Strategy

**Implementation status:** Target

New domain/application behavior follows red-green-refactor and targets at least 80% coverage. Unit tests protect state machines and calculations. Integration tests exercise real MongoDB replica-set transactions, Redis, RabbitMQ publisher confirms/consumers, Supertest HTTP contracts, and Socket.IO delivery across two replicas.

Playwright covers registration, booking, checkout, and messaging. k6 uses the dataset and traffic mix in the approved design. Resilience suites stop Redis, RabbitMQ, a worker, and one API replica, and repeat payment webhooks. Security gates combine negative integration tests with audits, CodeQL, Gitleaks, Trivy, and a ZAP baseline.

Legacy lint findings are measured once and ratcheted downward. CI never presents an existing failing baseline as clean, and blocks new violations in changed files.
