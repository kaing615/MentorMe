# ADR 0004: Cost-Conscious Single VPS

**Status:** Accepted

Nginx, two API slots, Redis, RabbitMQ, a worker, and a light telemetry collector share one 2 vCPU/4 GB VPS. Atlas, Cloudflare, and Cloudinary remain managed. This is process-resilient but not host-high-availability; a second VPS is triggered by measured capacity or availability needs.
