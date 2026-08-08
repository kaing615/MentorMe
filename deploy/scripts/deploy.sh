#!/usr/bin/env bash
set -Eeuo pipefail

TARGET_SHA="${1:-}"
if [[ ! "$TARGET_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "deployment tag must be a full lowercase Git SHA" >&2
  exit 64
fi

ROOT="${DEPLOY_ROOT:-/opt/mentorme}"
COMPOSE_FILE="$ROOT/deploy/compose.prod.yml"
ENV_FILE="$ROOT/.env"
METADATA="$ROOT/deploy/releases/current.env"
PUBLIC_URL="${PUBLIC_URL:-http://127.0.0.1}"
CURRENT_SHA="${CURRENT_SHA:-}"
ACTIVE_SLOT="${ACTIVE_SLOT:-api-a}"

if [[ -f "$METADATA" ]]; then
  # shellcheck disable=SC1090
  source "$METADATA"
fi
case "$ACTIVE_SLOT" in
  api-a) INACTIVE_SLOT="api-b" ;;
  api-b) INACTIVE_SLOT="api-a" ;;
  *) echo "invalid ACTIVE_SLOT: $ACTIVE_SLOT" >&2; exit 65 ;;
esac

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "flock /var/lock/mentorme-deploy.lock"
  echo "upstream $ACTIVE_SLOT"
  echo "pull $TARGET_SHA"
  echo "recreate $INACTIVE_SLOT $TARGET_SHA"
  echo "ready $INACTIVE_SLOT"
  echo "upstream api-a api-b"
  echo "nginx-test"
  echo "nginx-reload"
  echo "smoke $PUBLIC_URL"
  echo "upstream $INACTIVE_SLOT"
  echo "drain $ACTIVE_SLOT"
  echo "recreate $ACTIVE_SLOT $TARGET_SHA"
  echo "ready $ACTIVE_SLOT"
  echo "upstream api-a api-b"
  echo "nginx-test"
  echo "nginx-reload"
  echo "smoke $PUBLIC_URL"
  echo "recreate worker $TARGET_SHA"
  echo "metadata $TARGET_SHA $INACTIVE_SLOT"
  exit 0
fi

if [[ "${DEPLOY_LOCK_HELD:-0}" != "1" ]]; then
  exec flock -n /var/lock/mentorme-deploy.lock \
    env DEPLOY_LOCK_HELD=1 "$0" "$TARGET_SHA"
fi

compose() {
  IMAGE_TAG="$TARGET_SHA" docker compose \
    --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

render_upstream() {
  DEPLOY_ROOT="$ROOT" bash "$ROOT/deploy/scripts/render-upstream.sh" "$@"
  compose exec -T gateway nginx -t
  compose exec -T gateway nginx -s reload
}

wait_ready() {
  local slot="$1" port
  [[ "$slot" == "api-a" ]] && port=4001 || port=4002
  for _attempt in {1..30}; do
    if curl --fail --silent --show-error \
      "http://127.0.0.1:${port}/health/ready" >/dev/null; then
      return 0
    fi
    sleep 2
  done
  echo "$slot failed readiness" >&2
  return 1
}

rollback_on_error() {
  local exit_code=$?
  if [[ "${ROLLBACK_MODE:-0}" != "1" && "$CURRENT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
    echo "deployment failed; restoring $CURRENT_SHA" >&2
    ROLLBACK_MODE=1 DEPLOY_ROOT="$ROOT" PUBLIC_URL="$PUBLIC_URL" \
      bash "$ROOT/deploy/scripts/rollback.sh" "$CURRENT_SHA" || true
  fi
  exit "$exit_code"
}
trap rollback_on_error ERR

render_upstream "$ACTIVE_SLOT"
compose pull "$INACTIVE_SLOT" worker
compose up -d --no-deps "$INACTIVE_SLOT"
wait_ready "$INACTIVE_SLOT"
render_upstream api-a api-b
bash "$ROOT/deploy/scripts/smoke.sh" "$PUBLIC_URL"

render_upstream "$INACTIVE_SLOT"
sleep "${DRAIN_SECONDS:-10}"
compose up -d --no-deps "$ACTIVE_SLOT"
wait_ready "$ACTIVE_SLOT"
render_upstream api-a api-b
bash "$ROOT/deploy/scripts/smoke.sh" "$PUBLIC_URL"
compose up -d --no-deps worker

mkdir -p "$(dirname "$METADATA")"
metadata_tmp="${METADATA}.tmp.$$"
{
  echo "CURRENT_SHA=$TARGET_SHA"
  echo "ACTIVE_SLOT=$INACTIVE_SLOT"
  echo "DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$metadata_tmp"
mv -f "$metadata_tmp" "$METADATA"
trap - ERR
echo "deployed $TARGET_SHA"
