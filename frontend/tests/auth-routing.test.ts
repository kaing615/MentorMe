import assert from "node:assert/strict";
import test from "node:test";
import { getRoleHomePath } from "../src/routes/path.ts";

test("post-login navigation follows the active backend role", () => {
  assert.equal(getRoleHomePath("mentee"), "/home");
  assert.equal(getRoleHomePath("mentor"), "/mentor/dashboard");
  assert.equal(getRoleHomePath("admin"), "/admin");
});
