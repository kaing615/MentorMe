import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/homeScreen.tsx", import.meta.url), "utf8");

test("home sketch layout keeps marquee continuous and card spacing compact", () => {
  assert.match(source, /w-max min-w-screen/);
  assert.match(source, /lg:space-y-10 lg:pb-12/);
  assert.match(source, /rounded-\[var\(--ui-radius-lg\)\] border-2/);
});
