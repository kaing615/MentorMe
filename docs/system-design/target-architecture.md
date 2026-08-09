# Target Architecture

**Implementation status:** Target

Cloudflare Pages/CDN serves the SPA. Cloudflare DNS/WAF forwards API and WebSocket traffic to Nginx on one Linux VPS. Nginx provides TLS termination, gateway controls, and load balancing over two stateless Express replicas. Both replicas share Redis for cache, rate limits, and Socket.IO fan-out.

MongoDB Atlas remains authoritative. RabbitMQ carries durable at-least-once events from a MongoDB transactional outbox to a separate worker. Cloudinary, email, and payment providers remain external adapters. Production Compose exposes only Nginx; Redis, RabbitMQ, APIs, and telemetry stay on private networks.

The first scaling action is vertical VPS growth. A second VPS and managed load balancer are introduced only after measured host saturation or availability needs justify them. Module extraction requires a distinct scaling, release, ownership, or security boundary.

See the editable [C4 model](../diagrams/mentorme-c4.drawio) and the approved [production design](production-system-design.md).
