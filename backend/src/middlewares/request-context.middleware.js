import { randomUUID } from "node:crypto";

const REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function requestContext(request, response, next) {
  const incoming = request.get("x-request-id");
  const requestId = REQUEST_ID.test(incoming || "") ? incoming : randomUUID();
  request.id = requestId;
  response.set("x-request-id", requestId);
  next();
}

export default requestContext;
