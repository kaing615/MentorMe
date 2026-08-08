import { consumeRateLimit } from "../infrastructure/redis/rate-limit.js";

export function createRateLimit({
  redisClient,
  key,
  limit,
  windowMs,
  failureMode,
  logger = console,
  now = () => Date.now(),
}) {
  const local = new Map();

  function consumeLocal(rateKey) {
    const timestamp = now();
    const current = local.get(rateKey);
    const record = !current || current.expiresAt <= timestamp
      ? { count: 0, expiresAt: timestamp + windowMs }
      : current;
    record.count += 1;
    local.set(rateKey, record);
    if (local.size > 10000) {
      for (const [candidate, value] of local) {
        if (value.expiresAt <= timestamp) local.delete(candidate);
      }
    }
    const fallbackLimit = Math.max(1, Math.floor(limit / 2));
    return {
      allowed: record.count <= fallbackLimit,
      remaining: Math.max(0, fallbackLimit - record.count),
      retryAfterMs: Math.max(0, record.expiresAt - timestamp),
    };
  }

  return async function rateLimit(request, response, next) {
    const rateKey = key(request);
    try {
      const result = await consumeRateLimit({
        client: redisClient,
        key: `rate:${rateKey}`,
        limit,
        windowMs,
      });
      response.set("RateLimit-Limit", limit);
      response.set("RateLimit-Remaining", result.remaining);
      if (result.allowed) return next();
      response.set("Retry-After", Math.ceil(result.retryAfterMs / 1000));
      return response.status(429).json({
        code: "RATE_LIMITED",
        message: "Too many requests",
        retryAfterMs: result.retryAfterMs,
      });
    } catch (error) {
      logger.warn?.({ err: error, rateKey }, "distributed rate limit degraded");
      if (failureMode === "open") return next();
      const result = consumeLocal(rateKey);
      if (result.allowed) return next();
      response.set("Retry-After", Math.ceil(result.retryAfterMs / 1000));
      return response.status(429).json({
        code: "RATE_LIMITED_DEGRADED",
        message: "Too many requests while distributed limiting is degraded",
        retryAfterMs: result.retryAfterMs,
      });
    }
  };
}
