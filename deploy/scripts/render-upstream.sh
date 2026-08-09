#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${DEPLOY_ROOT:-/opt/mentorme}"
OUTPUT="${UPSTREAM_FILE:-$ROOT/deploy/nginx/upstreams/api.conf}"
if (($# == 0)); then
  echo "at least one API slot is required" >&2
  exit 64
fi

temporary="${OUTPUT}.tmp.$$"
{
  echo "upstream mentorme_api {"
  echo "    least_conn;"
  for slot in "$@"; do
    case "$slot" in
      api-a|api-b) echo "    server ${slot}:4000 max_fails=3 fail_timeout=10s;" ;;
      *) echo "invalid API slot: $slot" >&2; exit 64 ;;
    esac
  done
  echo "    keepalive 32;"
  echo "}"
} > "$temporary"
mv -f "$temporary" "$OUTPUT"
