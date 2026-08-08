import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const nextSha = "a".repeat(40);
const previousSha = "b".repeat(40);

function toBashPath(value) {
  const normalized = value.replaceAll("\\", "/");
  const match = /^([A-Za-z]):\/(.*)$/.exec(normalized);
  return match ? `/mnt/${match[1].toLowerCase()}/${match[2]}` : normalized;
}

function runDeploy(value) {
  const script = `${toBashPath(process.cwd())}/deploy/scripts/deploy.sh`;
  const command = [
    "DRY_RUN=1",
    `CURRENT_SHA=${previousSha}`,
    "ACTIVE_SLOT=api-a",
    "PUBLIC_URL=https://mentorme.example",
    "DEPLOY_ROOT=/opt/mentorme",
    `bash '${script}' '${value}'`,
  ].join(" ");
  return spawnSync("bash", ["-c", command], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
    },
  });
}

test("rolling deployment drains and health-gates both slots before metadata", () => {
  const result = runDeploy(nextSha);
  assert.equal(result.status, 0, result.stderr);
  const output = result.stdout;
  const expectedOrder = [
    "flock",
    "upstream api-a",
    `pull ${nextSha}`,
    `recreate api-b ${nextSha}`,
    "ready api-b",
    "upstream api-a api-b",
    "nginx-test",
    "nginx-reload",
    "smoke https://mentorme.example",
    "upstream api-b",
    "drain api-a",
    `recreate api-a ${nextSha}`,
    "ready api-a",
    "upstream api-a api-b",
    "nginx-test",
    "nginx-reload",
    "smoke https://mentorme.example",
    `metadata ${nextSha} api-b`,
  ];
  let cursor = -1;
  for (const entry of expectedOrder) {
    const next = output.indexOf(entry, cursor + 1);
    assert.ok(next > cursor, `missing or out-of-order: ${entry}\n${output}`);
    cursor = next;
  }
});

test("deployment rejects mutable or malformed image tags", () => {
  for (const tag of ["latest", "main", "abc123"]) {
    const result = runDeploy(tag);
    assert.notEqual(result.status, 0, `accepted invalid tag ${tag}`);
  }
});
