import assert from "node:assert/strict";
import test from "node:test";
import { resolveApiBaseUrl } from "../src/api/clients/base-url.ts";

test("missing API URL uses the local backend", () => {
  assert.equal(resolveApiBaseUrl(""), "http://localhost:4000/api/v1");
});

test("API URL receives exactly one api/v1 suffix", () => {
  assert.equal(resolveApiBaseUrl("https://api.example.com"), "https://api.example.com/api/v1");
  assert.equal(resolveApiBaseUrl("https://api.example.com/api/v1/"), "https://api.example.com/api/v1");
});
