# Security

**Implementation status:** Target

- Fifteen-minute access JWT in memory; rotating opaque refresh token in a `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Hashed refresh-token storage, family revocation, reuse detection, logout, and RBAC.
- Exact production CORS allowlist, Helmet/CSP, bounded parsers, Joi normalization, HTML sanitization, and NoSQL injection controls.
- Upload MIME, extension, count, and byte limits before Cloudinary calls.
- Provider webhook signature, timestamp, replay, state-transition, and idempotency verification.
- Private Redis/RabbitMQ networks, Atlas TLS/IP allowlist, SSH keys only, UFW, non-root containers, and restricted deploy account.
- Structured log redaction and stable public errors without secrets or stack traces.
- CI secret, dependency, static-analysis, container, and dynamic application scans.

Security gates fail on unresolved critical/high production findings. Controls are not disabled to make a release pass.
