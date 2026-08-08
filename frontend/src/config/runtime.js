function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function apiRoot(value) {
  const root = stripTrailingSlash(value || "");
  if (!root) return "/api/v1";
  return /\/api\/v1$/i.test(root) ? root : `${root}/api/v1`;
}

export function buildRuntimeConfig(values = {}, browserOrigin = "") {
  const configuredApi = values.VITE_API_BASE_URL || values.VITE_API_URL || "";
  const apiBaseUrl = apiRoot(configuredApi);
  const origin = configuredApi
    ? new URL(configuredApi, browserOrigin || "http://runtime.invalid").origin
    : browserOrigin;
  const socketUrl = stripTrailingSlash(values.VITE_SOCKET_URL || origin || "");

  return Object.freeze({
    apiBaseUrl,
    socketUrl,
    resolveAssetUrl(value) {
      if (!value || /^(?:https?:|data:|blob:)/i.test(value)) return value;
      const normalized = value.startsWith("/") ? value : `/${value}`;
      return configuredApi ? `${origin}${normalized}` : normalized;
    },
  });
}

const runtime = buildRuntimeConfig(
  import.meta.env || {},
  typeof window === "undefined" ? "" : window.location.origin
);

export const { apiBaseUrl, resolveAssetUrl, socketUrl } = runtime;
export default runtime;
