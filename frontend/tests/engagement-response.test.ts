import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeFavorites,
  normalizeNotifications,
} from "../src/utils/engagement-response.ts";

test("normalizes wrapped engagement responses without mock fallbacks", () => {
  const course = { _id: "course-1", title: "Course" };
  const mentor = { _id: "mentor-1", firstName: "Mentor" };
  assert.deepEqual(
    normalizeFavorites({ data: { courses: [course], mentors: [mentor] } }),
    { courses: [course], mentors: [mentor] },
  );
  assert.deepEqual(normalizeFavorites(null), { courses: [], mentors: [] });

  const notification = { _id: "notification-1", type: "message_received" };
  assert.deepEqual(
    normalizeNotifications({
      data: {
        items: [notification],
        unreadCount: 1,
        total: 12,
        page: 2,
        limit: 5,
        hasMore: true,
      },
    }),
    {
      items: [notification],
      unreadCount: 1,
      total: 12,
      page: 2,
      limit: 5,
      hasMore: true,
    },
  );
  assert.deepEqual(normalizeNotifications(undefined), {
    items: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    limit: 20,
    hasMore: false,
  });
});
