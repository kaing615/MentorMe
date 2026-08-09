#!/usr/bin/env bash
set -Eeuo pipefail

TARGET_SHA="${1:-}"
if [[ ! "$TARGET_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "rollback tag must be a full lowercase Git SHA" >&2
  exit 64
fi
ROOT="${DEPLOY_ROOT:-/opt/mentorme}"
exec env ROLLBACK_MODE=1 DEPLOY_LOCK_HELD="${DEPLOY_LOCK_HELD:-0}" \
  bash "$ROOT/deploy/scripts/deploy.sh" "$TARGET_SHA"
