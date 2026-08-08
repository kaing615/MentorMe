import assert from "node:assert/strict";
import test from "node:test";

test("runtime config normalizes API, socket, and asset URLs", async () => {
  const module = await import("../src/config/runtime.js").catch(() => ({}));
  assert.equal(
    typeof module.buildRuntimeConfig,
    "function",
    "buildRuntimeConfig must exist"
  );

  const config = module.buildRuntimeConfig(
    { VITE_API_BASE_URL: "https://api.mentorme.example/" },
    "https://mentorme.example"
  );
  assert.equal(config.apiBaseUrl, "https://api.mentorme.example/api/v1");
  assert.equal(config.socketUrl, "https://api.mentorme.example");
  assert.equal(
    config.resolveAssetUrl("uploads/avatar.png"),
    "https://api.mentorme.example/uploads/avatar.png"
  );
});

test("runtime config uses same-origin paths when no API URL is configured", async () => {
  const { buildRuntimeConfig } = await import("../src/config/runtime.js");
  const config = buildRuntimeConfig({}, "https://mentorme.example");

  assert.equal(config.apiBaseUrl, "/api/v1");
  assert.equal(config.socketUrl, "https://mentorme.example");
  assert.equal(config.resolveAssetUrl("/media/course.jpg"), "/media/course.jpg");
});
