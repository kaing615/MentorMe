import assert from "node:assert/strict";
import test from "node:test";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("request policy rejects nested MongoDB operator keys", async () => {
  const module = await import(
    "../../src/middlewares/security.middleware.js"
  ).catch(() => ({}));
  assert.equal(typeof module.rejectMongoOperators, "function");

  const response = responseRecorder();
  let nextCalled = false;
  module.rejectMongoOperators(
    { body: { email: { $ne: null } }, query: {}, params: {} },
    response,
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, "INVALID_INPUT");
});

test("upload policy accepts image formats and rejects executable content", async () => {
  const module = await import(
    "../../src/middlewares/upload-policy.middleware.js"
  ).catch(() => ({}));
  assert.equal(typeof module.validateUploadMime, "function");
  assert.equal(module.validateUploadMime({ mimetype: "image/jpeg" }), true);
  assert.equal(module.validateUploadMime({ mimetype: "image/webp" }), true);
  assert.equal(module.validateUploadMime({ mimetype: "application/x-msdownload" }), false);
  assert.equal(module.validateUploadMime({ mimetype: "text/html" }), false);
});
