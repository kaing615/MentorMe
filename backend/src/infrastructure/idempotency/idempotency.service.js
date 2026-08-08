import IdempotencyRecord from "./idempotency.model.js";

function idempotencyError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function existingResult(record, requestHash) {
  if (record.requestHash !== requestHash) {
    throw idempotencyError(
      "IDEMPOTENCY_KEY_REUSED",
      "Idempotency key was already used with a different request"
    );
  }
  if (record.status === "completed") return record.result;
  throw idempotencyError(
    "IDEMPOTENCY_IN_PROGRESS",
    "An operation with this idempotency key is still in progress"
  );
}

export async function runIdempotent({
  scope,
  key,
  requestHash,
  work,
  model = IdempotencyRecord,
  expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
}) {
  if (!scope || !key || !requestHash) {
    throw idempotencyError(
      "INVALID_IDEMPOTENCY_INPUT",
      "scope, key, and requestHash are required"
    );
  }

  try {
    await model.create([
      { scope, key, requestHash, status: "processing", expiresAt },
    ]);
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const record = await model.findOne({ scope, key });
    return existingResult(record, requestHash);
  }

  try {
    const result = await work();
    await model.updateOne(
      { scope, key, requestHash },
      { $set: { status: "completed", result, errorCode: null } }
    );
    return result;
  } catch (error) {
    await model.updateOne(
      { scope, key, requestHash },
      { $set: { status: "failed", errorCode: error.code || "OPERATION_FAILED" } }
    );
    throw error;
  }
}
