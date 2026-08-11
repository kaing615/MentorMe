import assert from "node:assert/strict";
import test from "node:test";
import { hasUserRole } from "../src/utils/user-role.ts";

test("active and retained roles both grant a user capability", () => {
  assert.equal(hasUserRole({ role: "mentee" }, "mentee"), true);
  assert.equal(
    hasUserRole({ role: "mentor", roles: ["mentee", "mentor"] }, "mentee"),
    true,
  );
  assert.equal(hasUserRole({ role: "mentor", roles: ["mentor"] }, "mentee"), false);
});
