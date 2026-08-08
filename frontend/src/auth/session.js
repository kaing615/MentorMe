let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function createRefreshCoordinator(refresh) {
  let pending = null;
  return function refreshOnce() {
    if (!pending) {
      pending = Promise.resolve(refresh())
        .finally(() => { pending = null; });
    }
    return pending;
  };
}
