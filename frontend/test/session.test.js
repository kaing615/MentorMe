import assert from "node:assert/strict";
import test from "node:test";

test("access token lives only in module memory", async () => {
  const module = await import("../src/auth/session.js").catch(() => ({}));
  assert.equal(typeof module.setAccessToken, "function");
  module.setAccessToken("access-1");
  assert.equal(module.getAccessToken(), "access-1");
  module.clearAccessToken();
  assert.equal(module.getAccessToken(), null);
});

test("refresh coordinator serializes concurrent refresh attempts", async () => {
  const module = await import("../src/auth/session.js");
  let calls = 0;
  let release;
  const refresh = module.createRefreshCoordinator(
    () => new Promise((resolve) => {
      calls += 1;
      release = resolve;
    })
  );
  const first = refresh();
  const second = refresh();
  assert.equal(calls, 1);
  release("access-2");
  assert.equal(await first, "access-2");
  assert.equal(await second, "access-2");
});
