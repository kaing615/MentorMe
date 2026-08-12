import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/homeScreen.tsx", import.meta.url), "utf8");

test("home sketch layout keeps marquee continuous and card spacing compact", () => {
  assert.match(source, /w-max min-w-screen/);
  assert.match(source, /lg:space-y-10 lg:pb-12/);
  assert.match(source, /rounded-\[var\(--ui-radius-lg\)\] border-2/);
});

test("home and welcome hero headlines do not embed inline images", () => {
  const welcome = readFileSync(new URL("../src/pages/WelcomePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ui-inline-image/);
  assert.doesNotMatch(welcome, /ui-inline-image/);
  assert.doesNotMatch(styles, /\.ui-inline-image/);
});
