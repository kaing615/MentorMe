import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("public mentor profile shows the consultation price per session", () => {
  const source = readFileSync("src/pages/mentor-page.tsx", "utf8");

  assert.match(source, />Consultation fee</);
  assert.match(source, /formatVnd\(Number\(mentor\?\.profile\?\.sessionPrice/);
  assert.match(source, />\/ session</);
});

test("mentor-mode header hides discovery and mentor application controls", () => {
  const source = readFileSync("src/components/common/header.tsx", "utf8");

  assert.match(source, /const isMentorMode =/);
  assert.match(source, /\{!isMentorMode && \([\s\S]*?<SearchDropdown \/>[\s\S]*?Mentor with MentorMe[\s\S]*?\)\}/);
});
