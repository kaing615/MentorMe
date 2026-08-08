import { randomUUID } from "node:crypto";

const RELEASE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

export async function withLock(
  key,
  ttlMs,
  work,
  { client, token = randomUUID(), prefix = "lock" } = {}
) {
  if (!client?.isReady && client?.isReady !== undefined) {
    const error = new Error("Redis is unavailable; scheduler is paused");
    error.code = "LOCK_BACKEND_UNAVAILABLE";
    throw error;
  }
  const redisKey = `${prefix}:${key}`;
  const acquired = await client.set(redisKey, token, { NX: true, PX: ttlMs });
  if (acquired !== "OK") {
    const error = new Error("Distributed lock is already held");
    error.code = "LOCK_NOT_ACQUIRED";
    throw error;
  }
  try {
    return await work();
  } finally {
    await client.eval(RELEASE_SCRIPT, {
      keys: [redisKey],
      arguments: [token],
    });
  }
}

export { RELEASE_SCRIPT };
