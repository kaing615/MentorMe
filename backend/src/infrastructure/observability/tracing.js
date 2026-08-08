import { randomBytes } from "node:crypto";

const TRACEPARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

function randomHex(bytes) {
  return randomBytes(bytes).toString("hex");
}

export function createServerTraceContext(incoming) {
  const match = TRACEPARENT.exec(String(incoming || "").toLowerCase());
  const valid =
    match &&
    match[1] !== "0".repeat(32) &&
    match[2] !== "0".repeat(16);
  const traceId = valid ? match[1] : randomHex(16);
  const flags = valid ? match[3] : "01";
  const spanId = randomHex(8);
  return {
    traceId,
    spanId,
    traceparent: `00-${traceId}-${spanId}-${flags}`,
  };
}

export default createServerTraceContext;
