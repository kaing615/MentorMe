export function createResponseCache({ cache, namespace, ttlSeconds, key }) {
  if (!cache || typeof cache.get !== "function" || typeof cache.set !== "function") {
    throw new TypeError("A cache store with get/set methods is required");
  }

  return async function responseCache(request, response, next) {
    const cacheNamespace = typeof namespace === "function"
      ? namespace(request)
      : namespace;
    const cacheKey = key(request);

    try {
      const cached = await cache.get(cacheNamespace, cacheKey);
      if (cached !== null) return response.json(cached);
    } catch {
      // Redis is an optimization; reads continue against MongoDB on outage.
    }

    const sendJson = response.json.bind(response);
    response.json = function cacheSuccessfulResponse(body) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        Promise.resolve(cache.set(cacheNamespace, cacheKey, ttlSeconds, body)).catch(
          () => undefined
        );
      }
      return sendJson(body);
    };

    return next();
  };
}

export function invalidateCacheOnSuccess({ cache, namespaces }) {
  if (!cache || typeof cache.invalidate !== "function") {
    throw new TypeError("A cache store with an invalidate method is required");
  }

  return function cacheInvalidation(request, response, next) {
    const sendJson = response.json.bind(response);
    response.json = function invalidateAfterSuccess(body) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const targets = namespaces(request);
        Promise.all(targets.map((namespace) => cache.invalidate(namespace))).catch(
          () => undefined
        );
      }
      return sendJson(body);
    };
    return next();
  };
}
