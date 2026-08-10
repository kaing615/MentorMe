import assert from "node:assert/strict";
import test from "node:test";
import { resolveTheme } from "../src/utils/theme.ts";

test("saved theme overrides the operating-system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("missing or invalid theme follows the operating-system preference", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme("unknown", false), "light");
});
