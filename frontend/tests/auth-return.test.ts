import assert from "node:assert/strict";
import test from "node:test";
import { getLoginPath, getPostLoginPath } from "../src/utils/auth-return.ts";

test("protected actions return guests to the page where they started", () => {
  assert.equal(
    getLoginPath("/mentor/mentor-123"),
    "/auth/signin?returnTo=%2Fmentor%2Fmentor-123",
  );
  assert.equal(
    getPostLoginPath("/course-detail/course-123", "/home"),
    "/course-detail/course-123",
  );
});

test("post-login navigation rejects external return URLs", () => {
  assert.equal(getPostLoginPath("https://evil.example", "/home"), "/home");
  assert.equal(getPostLoginPath("//evil.example", "/mentor/dashboard"), "/mentor/dashboard");
});
