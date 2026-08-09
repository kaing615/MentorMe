import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("architecture documentation satisfies the repository contract", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-docs.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `documentation verification failed:\n${result.stdout}${result.stderr}`
  );
});

test("drawio validation rejects an edge without geometry", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mentorme-drawio-"));
  context.after(() => fs.rmSync(directory, { force: true, recursive: true }));
  const input = path.join(directory, "broken.drawio");
  fs.writeFileSync(
    input,
    '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" edge="1" parent="1"/></root></mxGraphModel></diagram></mxfile>'
  );

  const result = spawnSync(
    process.execPath,
    ["scripts/validate-drawio.mjs", input],
    { cwd: new URL("..", import.meta.url), encoding: "utf8" }
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /edge 2 has no relative geometry/);
});
