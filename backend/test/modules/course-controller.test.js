import assert from "node:assert/strict";
import test from "node:test";
import Course from "../../src/models/course.model.js";
import { getRelatedCourses } from "../../src/controllers/course.controller.js";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("related courses returns the queried courses without entering create-course code", async () => {
  const originalFind = Course.find;
  Course.find = () => ({
    populate() { return this; },
    sort() { return this; },
    async limit() {
      return [{
        toObject: () => ({ _id: "course-2", title: "Related course", __v: 0 }),
      }];
    },
  });
  try {
    const response = responseRecorder();
    await getRelatedCourses(
      { query: { category: "backend", limit: "6" } },
      response
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.total, 1);
    assert.equal(response.body.data.courses[0].courseId, "course-2");
  } finally {
    Course.find = originalFind;
  }
});
