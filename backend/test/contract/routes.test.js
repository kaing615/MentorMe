import test from "node:test";
import assert from "node:assert/strict";
import { routeMounts } from "../../src/routes/index.js";
import { routeManifest } from "./route-manifest.js";

test("legacy router mounts every public route prefix exactly once", () => {
  assert.deepEqual(
    routeMounts.map(({ path }) => path),
    routeManifest
  );
  assert.equal(new Set(routeManifest).size, routeManifest.length);
});

test("course aliases share one router implementation", () => {
  const course = routeMounts.find(({ path }) => path === "/course");
  const courses = routeMounts.find(({ path }) => path === "/courses");

  assert.equal(course.router, courses.router);
});
