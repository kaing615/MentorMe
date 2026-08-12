import assert from "node:assert/strict";
import test from "node:test";
import { buildMentorProfilePayload } from "../src/utils/mentor-profile-payload.ts";

test("builds the mentor DTO without treating the loaded avatar URL as an upload", () => {
  const payload = buildMentorProfilePayload({
    userName: "quan.tran",
    firstName: "Quân",
    lastName: "Trần",
    jobTitle: "Senior Backend Engineer",
    category: "Programming",
    bio: "A sufficiently detailed mentor biography that passes backend validation.",
    mentorReason: "I want to share practical production lessons.",
    experience: "Eight years building backend services.",
    skills: "Node.js, NestJS, TypeScript",
    avatarUrl: "https://example.com/avatar.png",
    website: "https://example.com",
    linkedin: "https://linkedin.com/in/quan-tran",
    sessionPrice: "0",
  });

  assert.deepEqual(payload.skills, ["Node.js", "NestJS", "TypeScript"]);
  assert.equal(payload.sessionPrice, 0);
  assert.equal("avatarUrl" in payload, false);
  assert.deepEqual(payload.links, {
    website: "https://example.com",
    twitter: "",
    linkedin: "https://linkedin.com/in/quan-tran",
    youtube: "",
    facebook: "",
  });
  assert.equal("languages" in payload, false);
});
