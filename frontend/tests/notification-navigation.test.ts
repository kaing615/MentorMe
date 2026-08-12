import assert from "node:assert/strict";
import test from "node:test";
import { getNotificationTarget } from "../src/utils/notification-navigation.ts";

test("notification events resolve to the correct role-specific destination", () => {
  assert.deepEqual(getNotificationTarget("message_received", false, "/fallback"), {
    path: "/profile",
    storageKey: "menteeProfileTab",
    tab: "messages",
  });
  assert.deepEqual(getNotificationTarget("booking_created", true, "/fallback"), {
    path: "/mentor/dashboard",
    storageKey: "mentorProfileTab",
    tab: "response",
  });
  assert.deepEqual(getNotificationTarget("review_received", true, "/fallback"), {
    path: "/mentor/dashboard",
    storageKey: "mentorProfileTab",
    tab: "reviews",
  });
  assert.deepEqual(getNotificationTarget("course_completed", false, "/fallback"), {
    path: "/profile",
    storageKey: "menteeProfileTab",
    tab: "mycourses",
  });
  assert.deepEqual(
    getNotificationTarget("payment_failed", false, "/fallback", {
      orderNumber: "ORD-123",
    }),
    { path: "/order-detail?orderId=ORD-123" },
  );
  assert.deepEqual(getNotificationTarget("unknown", false, "/fallback"), {
    path: "/fallback",
  });
});
