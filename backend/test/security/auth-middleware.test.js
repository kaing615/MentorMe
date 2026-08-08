import assert from "node:assert/strict";
import test from "node:test";
import User from "../../src/models/user.model.js";
import { verifyToken } from "../../src/middlewares/auth.middleware.js";
import { signAccessToken } from "../../src/modules/identity/access-token.js";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("canonical auth middleware rejects an unverified account", async () => {
  const originalFindById = User.findById;
  User.findById = () => ({
    async select() {
      return { _id: "507f1f77bcf86cd799439011", role: "mentee", isVerified: false };
    },
  });
  try {
    const token = signAccessToken({ id: "507f1f77bcf86cd799439011" });
    const response = responseRecorder();
    let nextCalled = false;
    await verifyToken(
      { headers: { authorization: `Bearer ${token}` } },
      response,
      () => { nextCalled = true; }
    );
    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 401);
  } finally {
    User.findById = originalFindById;
  }
});
