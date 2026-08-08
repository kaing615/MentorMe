import mongoose from "mongoose";

function transient(error) {
  return Boolean(
    error?.hasErrorLabel?.("TransientTransactionError") ||
      error?.hasErrorLabel?.("UnknownTransactionCommitResult")
  );
}

export async function withTransaction(
  work,
  { client = mongoose, maxAttempts = 3 } = {}
) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const session = await client.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error) {
      lastError = error;
      if (!transient(error) || attempt === maxAttempts) throw error;
    } finally {
      await session.endSession();
    }
  }
  throw lastError;
}
