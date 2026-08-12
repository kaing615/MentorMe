import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

test("prominent product surfaces use text instead of decorative icons", () => {
  assert.doesNotMatch(source("pages/MentorDashboard.tsx"), /Icon(?:ChartDots3|Book2|CalendarEvent|Cash|Clock|MessageCircle|Settings|Star|Users)/);
  assert.doesNotMatch(source("pages/homeScreen.tsx"), /Icon(?:MessageCircle|TrendingUp|Star|Users)/);
});

test("direction cards keep monochrome category icons", () => {
  const contents = source("pages/homeScreen.tsx");
  assert.match(contents, /icon: IconCode/);
  assert.match(contents, /<CategoryIcon[^>]+text-current/);
});

test("social icons remain allowed", () => {
  assert.match(source("pages/mentor-profile.tsx"), /FaLinkedin/);
});

test("public mentor social links show brand icons except website and intro video", () => {
  const contents = source("pages/mentor-page.tsx");
  for (const icon of ["FaXTwitter", "FaLinkedin", "FaGithub", "FaYoutube", "FaFacebook"]) {
    assert.match(contents, new RegExp(`<${icon}`));
  }
  assert.match(contents, />\s*Website\s*<\/a>/);
  assert.match(contents, />\s*Intro Video\s*<\/button>/);
});

test("visible UI does not use decorative emoji or star glyphs", () => {
  const root = new URL("../src/", import.meta.url);
  const files = readdirSync(root, { recursive: true })
    .filter((path) => String(path).endsWith(".tsx"));

  for (const path of files) {
    assert.doesNotMatch(readFileSync(new URL(String(path), root), "utf8"), /[📚📅💬⭐🔍✨😞😐🙂😊🤩★☆]/u, String(path));
  }
});

test("mentor dashboard tabs do not use decorative emoji", () => {
  assert.doesNotMatch(source("pages/mentor-profile.tsx"), /[📊📋⏰✅❌⏳❓]/u);
});
