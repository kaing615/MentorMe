import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(file) {
  return fs.readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
}

test("production topology defines two private API slots and a gateway", () => {
  const compose = read("deploy/compose.prod.yml");
  for (const service of ["gateway", "api-a", "api-b", "worker", "redis", "rabbitmq"]) {
    assert.match(compose, new RegExp(`^  ${service}:`, "m"), `${service} is missing`);
  }
  assert.match(compose, /127\.0\.0\.1:4001:4000/);
  assert.match(compose, /127\.0\.0\.1:4002:4000/);
  assert.equal((compose.match(/image: "\$\{API_IMAGE/g) || []).length, 3);
  assert.match(compose, /no-new-privileges:true/g);
  assert.doesNotMatch(compose, /6379:6379|5672:5672|15672:15672/);
});

test("Nginx forwards request IDs and WebSocket upgrades to both slots", () => {
  const nginx = read("deploy/nginx/conf.d/mentorme.conf");
  const upstream = read("deploy/nginx/upstreams/api.conf");
  assert.match(upstream, /server api-a:4000/);
  assert.match(upstream, /server api-b:4000/);
  assert.match(nginx, /proxy_set_header Upgrade \$http_upgrade/);
  assert.match(nginx, /proxy_set_header Connection \$connection_upgrade/);
  assert.match(nginx, /proxy_set_header X-Request-ID \$request_id/);
  assert.match(nginx, /ssl_certificate \/etc\/nginx\/certs\/origin\.pem/);
});

test("backend image is pinned, multi-stage, and non-root", () => {
  const dockerfile = read("backend/Dockerfile");
  assert.match(dockerfile, /^FROM node:22-alpine AS build/m);
  assert.ok((dockerfile.match(/^FROM /gm) || []).length >= 2);
  assert.match(dockerfile, /npm prune --omit=dev/);
  assert.match(dockerfile, /^USER 1000:1000$/m);
  assert.match(dockerfile, /^HEALTHCHECK /m);
});
