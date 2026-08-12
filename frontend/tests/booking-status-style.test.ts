import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("uses the API active status for accepted booking card styling", () => {
  const source = readFileSync("src/pages/mentor-profile.tsx", "utf8");
  assert.match(source, /booking\.status === "active"\s*\? "border-green-200/);
});
