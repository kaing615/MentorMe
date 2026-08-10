const LOCAL_API_URL = "http://localhost:4000/api/v1";

export const resolveApiBaseUrl = (value?: string): string => {
  const root = value?.trim().replace(/\/+$/, "") || "";
  if (!root) return LOCAL_API_URL;
  return /\/api\/v1$/i.test(root) ? root : `${root}/api/v1`;
};
