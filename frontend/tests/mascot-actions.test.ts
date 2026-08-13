import assert from "node:assert/strict";
import test from "node:test";
import { getMascotActions, shouldShowMascot } from "../src/utils/mascot-actions.ts";

test("Mimo only appears for a signed-in mentee outside the welcome page", () => {
  assert.equal(shouldShowMascot("/home", null, false, false), false);
  assert.equal(shouldShowMascot("/", { role: "mentee" }, true, false), false);
  assert.equal(shouldShowMascot("/home", { role: "mentee" }, true, false), true);
  assert.equal(shouldShowMascot("/mentor/dashboard", { role: "mentor" }, true, true), false);
});

test("Mimo exposes real quick actions for the active user mode", () => {
  assert.deepEqual(
    getMascotActions({ role: "mentee" }, false).map(({ label, path, tab }) => ({
      label,
      path,
      tab,
    })),
    [
      { label: "Find a mentor", path: "/all-mentors", tab: undefined },
      { label: "Browse courses", path: "/all-courses", tab: undefined },
      { label: "My bookings", path: "/profile", tab: "mybookings" },
      { label: "Messages", path: "/profile", tab: "messages" },
    ],
  );

  assert.deepEqual(
    getMascotActions(
      { role: "mentor", roles: ["mentor", "mentee"] },
      true,
    ).map(({ label, path, tab }) => ({ label, path, tab })),
    [
      { label: "Manage bookings", path: "/mentor/dashboard", tab: "response" },
      { label: "My courses", path: "/mentor/dashboard", tab: "mycourses" },
      { label: "Messages", path: "/mentor/dashboard", tab: "messages" },
      { label: "Profile", path: "/mentor/dashboard", tab: "profile" },
    ],
  );

  assert.equal(
    getMascotActions({ role: "mentor" }, false)[0]?.label,
    "Manage bookings",
  );
});
