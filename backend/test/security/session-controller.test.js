import assert from "node:assert/strict";
import test from "node:test";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    cookies: [],
    cleared: [],
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    cookie(name, value, options) { this.cookies.push({ name, value, options }); return this; },
    clearCookie(name, options) { this.cleared.push({ name, options }); return this; },
    end() { return this; },
  };
}

test("refresh rotates the cookie and returns a short-lived access token", async () => {
  const module = await import(
    "../../src/modules/identity/session.controller.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createSessionController, "function");

  const controller = module.createSessionController({
    tokens: {
      async rotate(token) {
        assert.equal(token, "old-refresh");
        return { token: "new-refresh", userId: "user-1" };
      },
    },
    users: { async findSafeById() { return { _id: "user-1", role: "mentee" }; } },
    signAccess: (payload, options) => {
      assert.deepEqual(payload, { id: "user-1", role: "mentee" });
      assert.deepEqual(options, { expiresIn: "15m" });
      return "access-token";
    },
  });
  const response = responseRecorder();
  await controller.refresh(
    { cookies: { mentorme_refresh: "old-refresh" } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.token, "access-token");
  assert.deepEqual(response.cookies[0], {
    name: "mentorme_refresh",
    value: "new-refresh",
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/v1/user",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  });
});

test("logout revokes the presented refresh token and clears its cookie", async () => {
  const module = await import(
    "../../src/modules/identity/session.controller.js"
  );
  const revoked = [];
  const controller = module.createSessionController({
    tokens: { async revoke(token) { revoked.push(token); } },
    users: {},
    signAccess: () => "unused",
  });
  const response = responseRecorder();
  await controller.logout(
    { cookies: { mentorme_refresh: "refresh-token" } },
    response
  );

  assert.deepEqual(revoked, ["refresh-token"]);
  assert.equal(response.statusCode, 204);
  assert.deepEqual(response.cleared[0], {
    name: "mentorme_refresh",
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/v1/user",
    },
  });
});
