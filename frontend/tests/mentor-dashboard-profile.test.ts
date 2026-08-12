import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("keeps every mentor workspace section inside the dashboard", () => {
  const dashboard = readFileSync("src/pages/MentorDashboard.tsx", "utf8");
  assert.match(dashboard, /<MentorProfilePanel/);
  assert.match(dashboard, /<MentorProfile[\s\S]*embedded/);
  assert.doesNotMatch(dashboard, /navigate\("\/mentor\/profile"\)/);
  assert.match(dashboard, /setActiveSection\(tab\)/);
  for (const tab of [
    "response",
    "schedule",
    "mycourses",
    "mentees",
    "messages",
    "reviews",
    "earnings",
    "profile",
  ]) {
    assert.match(dashboard, new RegExp(`"${tab}"`));
  }
  assert.match(dashboard, /profile\?\.user\?\.avatarUrl/);
  assert.match(dashboard, />Mentor</);
});

test("legacy mentor profile route redirects to the dashboard", () => {
  const routes = readFileSync("src/routes/elements.tsx", "utf8");
  assert.match(routes, /path: MENTOR_PATH\.PROFILE,[\s\S]*Navigate to="\/mentor\/dashboard"/);
});
