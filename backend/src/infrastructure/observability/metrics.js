import client from "prom-client";

export function createMetrics({ collectDefaults = true } = {}) {
  const registry = new client.Registry();
  if (collectDefaults) {
    client.collectDefaultMetrics({ register: registry, prefix: "mentorme_" });
  }
  const httpDuration = new client.Histogram({
    name: "mentorme_http_request_duration_seconds",
    help: "HTTP request latency in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
  });
  const activeWebSockets = new client.Gauge({
    name: "mentorme_websocket_connections",
    help: "Current authenticated WebSocket connections",
    registers: [registry],
  });
  const dependencyState = new client.Gauge({
    name: "mentorme_dependency_ready",
    help: "Dependency readiness state (1 ready, 0 unavailable)",
    labelNames: ["dependency"],
    registers: [registry],
  });

  return {
    activeWebSockets,
    dependencyState,
    middleware(request, response, next) {
      const startedAt = process.hrtime.bigint();
      response.once("finish", () => {
        const elapsed = Number(process.hrtime.bigint() - startedAt) / 1e9;
        const route = request.route?.path || "unmatched";
        httpDuration.observe(
          {
            method: request.method,
            route,
            status_code: String(response.statusCode),
          },
          elapsed
        );
      });
      next();
    },
    contentType: registry.contentType,
    render: () => registry.metrics(),
  };
}

export default createMetrics;
