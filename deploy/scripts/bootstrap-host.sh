#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "run as root" >&2
  exit 77
fi
DEPLOY_USER="${DEPLOY_USER:-mentorme}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/mentorme}"

id "$DEPLOY_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$DEPLOY_USER"
install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_ROOT"
install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_ROOT/deploy/releases"
echo "Host directory prepared. Install Docker Engine from Docker's official repository,"
echo "then grant $DEPLOY_USER access only to the deployment commands required by the runbook."
