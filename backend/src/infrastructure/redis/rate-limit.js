const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return {count, ttl}
`;

export async function consumeRateLimit({ client, key, limit, windowMs }) {
  const [rawCount, rawTtl] = await client.eval(RATE_LIMIT_SCRIPT, {
    keys: [key],
    arguments: [String(windowMs)],
  });
  const count = Number(rawCount);
  const retryAfterMs = Math.max(0, Number(rawTtl));
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterMs,
  };
}

export { RATE_LIMIT_SCRIPT };
