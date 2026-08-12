import assert from "node:assert/strict";
import test from "node:test";
import {
  getHeaderActionTarget,
  shouldShowMenteeHeaderActions,
} from "../src/utils/header-navigation.ts";

test("header actions resolve to their real pages", () => {
  assert.deepEqual(getHeaderActionTarget("favorites", false), {
    path: "/favorites",
  });
  assert.deepEqual(getHeaderActionTarget("cart", false), {
    path: "/shoppingcart",
  });
  assert.deepEqual(getHeaderActionTarget("notifications", false), {
    path: "/notifications",
  });
  assert.deepEqual(getHeaderActionTarget("notifications", true), {
    path: "/notifications",
  });
});

test("mentee actions are hidden while a dual-role user is in mentor mode", () => {
  assert.equal(
    shouldShowMenteeHeaderActions({ role: "mentee" }, false),
    true,
  );
  assert.equal(
    shouldShowMenteeHeaderActions(
      { role: "mentor", roles: ["mentor", "mentee"] },
      false,
    ),
    true,
  );
  assert.equal(
    shouldShowMenteeHeaderActions(
      { role: "mentor", roles: ["mentor", "mentee"] },
      true,
    ),
    false,
  );
  assert.equal(
    shouldShowMenteeHeaderActions({ role: "mentor" }, true),
    false,
  );
  assert.equal(
    shouldShowMenteeHeaderActions({ role: "admin", roles: ["admin", "mentee"] }, false),
    false,
  );
});
