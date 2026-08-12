import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("mentor settings uses the canonical category dropdown", () => {
  const source = readFileSync("src/components/mentor/MentorProfilePanel.tsx", "utf8");

  assert.match(source, /<select name="category"/);
  for (const category of ["Programming", "Design", "Business", "Marketing"]) {
    assert.match(source, new RegExp(`<option value="${category}">${category}<\\/option>`));
  }
  assert.doesNotMatch(source, /\["Category", "category"\]/);
});

test("mentee only sees Rate Mentor after a reviewable interaction", () => {
  const source = readFileSync("src/pages/mentee-profile.tsx", "utf8");

  assert.match(source, /existing\.hasFinishedBooking \|\|= b\.status === "finished"/);
  assert.match(source, /mentor\.canRate && \(/);
  assert.doesNotMatch(
    source,
    /booking\.status === "active" \|\| booking\.status === "finished"/,
  );
  assert.match(source, /const canReview = booking\.status === "finished"/);
  assert.doesNotMatch(source, /reviewBooking\.status === "active" && isPastConsultation/);
});
