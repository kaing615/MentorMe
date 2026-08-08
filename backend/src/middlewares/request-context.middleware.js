import { randomUUID } from "node:crypto";
import { createServerTraceContext } from "../infrastructure/observability/tracing.js";

const REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function requestContext(request, response, next) {
  const incoming = request.get("x-request-id");
  const requestId = REQUEST_ID.test(incoming || "") ? incoming : randomUUID();
  request.id = requestId;
  request.trace = createServerTraceContext(request.get("traceparent"));
  response.set("x-request-id", requestId);
  response.set("traceparent", request.trace.traceparent);
  next();
}

export default requestContext;
