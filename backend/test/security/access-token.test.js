import assert from "node:assert/strict";
import test from "node:test";

test("access tokens use the configured secret and lifetime", async () => {
  const module = await import("../../src/modules/identity/access-token.js").catch(
    () => ({})
  );
  assert.equal(typeof module.signAccessToken, "function");
  assert.equal(typeof module.verifyAccessToken, "function");

  const secret = "portfolio-access-secret-with-32-characters";
  const token = module.signAccessToken(
    { id: "507f1f77bcf86cd799439011", role: "mentee" },
    { secret, expiresIn: "15m" }
  );
  const payload = module.verifyAccessToken(token, { secret });
  assert.equal(payload.id, "507f1f77bcf86cd799439011");
  assert.equal(payload.role, "mentee");
  assert.ok(payload.exp - payload.iat <= 15 * 60);
  assert.throws(
    () => module.verifyAccessToken(token, { secret: "x".repeat(40) }),
    /invalid signature/
  );
});
