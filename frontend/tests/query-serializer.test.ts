import assert from "node:assert/strict";
import test from "node:test";
import { serializeQuery } from "../src/api/clients/query-serializer.ts";

test("serializes message query values without spreading strings into characters", () => {
  assert.equal(
    serializeQuery({ peer: "6a7bda99031000eff78f2194", limit: 50 }),
    "limit=50&peer=6a7bda99031000eff78f2194",
  );
});
