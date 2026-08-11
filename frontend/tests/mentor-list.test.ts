import assert from "node:assert/strict";
import test from "node:test";
import {
  filterMentors,
  mapMentorListResponse,
} from "../src/utils/mentor-list.ts";

test("mentor list maps only backend mentors and preserves an empty result", () => {
  assert.deepEqual(
    mapMentorListResponse({
      data: {
        mentors: [
          {
            _id: "mentor-1",
            firstName: "An",
            lastName: "Nguyen",
            jobTitle: "Staff Engineer",
            avatarUrl: "https://cdn.example.com/an.jpg",
            bio: "Production mentor",
            skills: ["TypeScript", "Leadership"],
            averageRating: 4.8,
            totalReviews: 9,
            totalStudents: 12,
            sessionPrice: 500000,
          },
        ],
      },
    }),
    [
      {
        id: "mentor-1",
        name: "An Nguyen",
        title: "Staff Engineer",
        avatar: "https://cdn.example.com/an.jpg",
        description: "Production mentor",
        skills: ["TypeScript", "Leadership"],
        rating: 4.8,
        reviewCount: 9,
        studentCount: 12,
        sessionPrice: 500000,
      },
    ],
  );
  assert.deepEqual(mapMentorListResponse({ data: { mentors: [] } }), []);
  assert.deepEqual(mapMentorListResponse(undefined), []);
});

test("mentor search filters backend mentors without inventing fallback results", () => {
  const mentors = [
    {
      _id: "mentor-1",
      firstName: "An",
      lastName: "Nguyen",
      jobTitle: "Staff Engineer",
      category: "Programming",
      skills: ["TypeScript", "Leadership"],
    },
    {
      _id: "mentor-2",
      firstName: "Linh",
      lastName: "Tran",
      jobTitle: "Product Designer",
      category: "Design",
      skills: ["Research", "Figma"],
    },
  ];

  assert.deepEqual(
    filterMentors(mentors, "figma").map((mentor) => mentor._id),
    ["mentor-2"],
  );
  assert.deepEqual(filterMentors([], "anything"), []);
});
