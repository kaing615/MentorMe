function deadline(promise, timeoutMs) {
  let timeout;
  const expired = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Redis operation timed out")), timeoutMs);
  });
  return Promise.race([promise, expired]).finally(() => clearTimeout(timeout));
}

export function createCacheStore(client, { timeoutMs = 100, prefix = "cache" } = {}) {
  async function redis(operation, fallback) {
    try {
      return await deadline(operation(), timeoutMs);
    } catch {
      return fallback;
    }
  }

  async function version(namespace) {
    return (await redis(() => client.get(`${prefix}-version:${namespace}`), null)) || "0";
  }

  return {
    async get(namespace, key) {
      const currentVersion = await version(namespace);
      const cacheKey = `${prefix}:${namespace}:${currentVersion}:${key}`;
      const cached = await redis(() => client.get(cacheKey), null);
      if (cached === null) return null;

      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    },
    async set(namespace, key, ttlSeconds, value) {
      const currentVersion = await version(namespace);
      const cacheKey = `${prefix}:${namespace}:${currentVersion}:${key}`;
      return redis(
        () => client.set(cacheKey, JSON.stringify(value), { EX: ttlSeconds }),
        null
      );
    },
    async getOrLoad(namespace, key, ttlSeconds, loader) {
      const cached = await this.get(namespace, key);
      if (cached !== null) return cached;

      const loaded = await loader();
      await this.set(namespace, key, ttlSeconds, loaded);
      return loaded;
    },
    async invalidate(namespace) {
      return redis(() => client.incr(`${prefix}-version:${namespace}`), null);
    },
  };
}
