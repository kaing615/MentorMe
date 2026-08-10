import assert from "node:assert/strict";
import test from "node:test";
import { formatVnd, parseVndPriceRange } from "../src/utils/currency.ts";

test("formats stored course prices as Vietnamese dong", () => {
  assert.equal(formatVnd(125000), "125.000 ₫");
  assert.equal(formatVnd(undefined), "0 ₫");
});

test("parses free, bounded, and open-ended VND price ranges", () => {
  assert.deepEqual(parseVndPriceRange("free"), { max: 0 });
  assert.deepEqual(parseVndPriceRange("0-500000"), {
    min: 0,
    max: 500000,
  });
  assert.deepEqual(parseVndPriceRange("2000000+"), { min: 2000000 });
  assert.deepEqual(parseVndPriceRange(""), {});
});
