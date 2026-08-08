import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

test("graceful shutdown rejects readiness before closing the listener", async () => {
  const module = await import("../../src/server.js").catch(() => ({}));
  assert.equal(
    typeof module.shutdownRuntime,
    "function",
    "shutdownRuntime must exist"
  );

  const health = { acceptingTraffic: true, dependencies: {} };
  const server = http.createServer((_request, response) => response.end("ok"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  assert.equal(server.listening, true);

  await module.shutdownRuntime({
    health,
    server,
    io: null,
    closeDependencies: async () => {},
    timeoutMs: 500,
  });

  assert.equal(health.acceptingTraffic, false);
  assert.equal(server.listening, false);
});
