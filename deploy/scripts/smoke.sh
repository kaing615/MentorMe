#!/usr/bin/env sh
set -eu

base_url="${1:?usage: smoke.sh https://api.example.com}"
curl_flags="--fail --silent --show-error --max-time 10"
if [ "${SMOKE_INSECURE:-false}" = "true" ]; then
  curl_flags="$curl_flags --insecure"
fi

curl $curl_flags "$base_url/health/live" >/dev/null
curl $curl_flags "$base_url/health/ready" >/dev/null

instances=""
attempt=1
while [ "$attempt" -le 20 ]; do
  headers="$(curl $curl_flags --head "$base_url/health/ready")"
  instance="$(printf '%s\n' "$headers" | awk 'BEGIN{IGNORECASE=1} /^x-instance-id:/ {gsub("\r", "", $2); print $2}')"
  instances="$instances $instance"
  attempt=$((attempt + 1))
done

printf '%s\n' "$instances" | grep -q "api-a"
printf '%s\n' "$instances" | grep -q "api-b"
printf 'Smoke checks passed through api-a and api-b.\n'
