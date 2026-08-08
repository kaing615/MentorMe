# Operations Runbook

**Implementation status:** Mixed

## One-time production setup

1. Provision Ubuntu on a 2 vCPU/4 GB VPS, create the `mentorme` deploy user, install Docker Engine from Docker's official repository, and place the repository deployment bundle under `/opt/mentorme`.
2. Create `/opt/mentorme/.env` from `deploy/env/production.env.example`; keep it owner-readable only and never commit it.
3. Add a protected GitHub Environment named `production` with required reviewers and main-branch-only deployment.
4. Configure environment secrets `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`, `PRODUCTION_KNOWN_HOSTS`, `PRODUCTION_GHCR_TOKEN`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID`.
5. Configure environment variables `PRODUCTION_URL`, `PRODUCTION_API_URL`, `PRODUCTION_SOCKET_URL`, and `CLOUDFLARE_PROJECT_NAME`. Leaving the Cloudflare project variable empty intentionally skips frontend deployment.
6. Point DNS/Cloudflare to the VPS, install the origin certificate files expected by Compose, then run the smoke script before enabling traffic.

## Release

1. Approve the protected GitHub `production` Environment for a tested Git SHA.
2. The workflow pushes immutable GHCR images, acquires server `flock`, removes one API slot from Nginx, drains it, replaces it, and polls readiness.
3. After smoke success, restore the slot and repeat for the second slot.
4. Record SHA, previous SHA, operator, timestamps, and smoke result.

The workflow accepts only a full 40-character Git SHA and publishes only `ghcr.io/<owner>/<repo>/api:<sha>`. GitHub concurrency and server-side `flock` prevent overlapping releases.

## Rollback

Drain one slot, replace it with the recorded previous SHA, verify readiness, return traffic, and repeat. Image rollback never reverses data; expand/contract migrations keep both releases compatible. A failed migration stops before traffic switching.

Manual rollback:

```bash
cd /opt/mentorme
DEPLOY_ROOT=/opt/mentorme bash deploy/scripts/rollback.sh <40-character-prior-sha>
```

## Dependency incidents

- Redis: bypass cache, alert on weaker per-process write limiting, pause lock-dependent schedulers, verify durable messages from MongoDB after reconnect.
- RabbitMQ: keep business/outbox writes, restore broker, watch publisher lag, and authenticated-redrive DLQs after cause removal.
- MongoDB: fail readiness and reject writes; do not return false success.
- VPS: provision a clean host, restore secrets and Compose configuration, validate Atlas data, start services, and pass smoke checks within 60 minutes.

## Backup evidence

Record Atlas backup timestamp daily. Run a monthly restore drill into an isolated database and record start/end time, restored record counts, application smoke result, and operator.
