import assert from "node:assert/strict";
import test from "node:test";
import { formatVnd } from "../src/utils/currency.ts";

test("formats stored course prices as Vietnamese dong", () => {
  assert.equal(formatVnd(125000), "125.000 ₫");
  assert.equal(formatVnd(undefined), "0 ₫");
});
