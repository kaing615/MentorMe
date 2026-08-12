/**
 * General API Client for authenticated requests
 * Sử dụng cho các API calls cần authentication token
 */

import axios from "axios";
import { resolveApiBaseUrl } from "./base-url";
import { serializeQuery } from "./query-serializer";

// Cấu hình base URL từ environment variables
const baseURL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

// Tạo axios instance
const apiClient = axios.create({
  baseURL,
  paramsSerializer: { serialize: serializeQuery },
});

// Request interceptor - tự động thêm Authorization header
apiClient.interceptors.request.use((config) => {
  const isFormData = config.data instanceof FormData;
  if (!isFormData) config.headers.set("Content-Type", "application/json");

  // Lấy token từ storage (ưu tiên sessionStorage)
  const raw = sessionStorage.getItem("actkn") || localStorage.getItem("actkn");
  const token = raw?.replace(/^Bearer\s+/i, "")?.replace(/^"|"$/g, "");

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Response interceptor - xử lý lỗi authentication
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      console.warn("401 Unauthorized - Token expired or invalid");
      // Xóa token và redirect về login
      sessionStorage.removeItem("actkn");
      localStorage.removeItem("actkn");
      window.location.href = "/auth/signin";
      return Promise.reject(error);
    }
    
    if (status === 403) {
      console.warn("403 Forbidden - Insufficient permissions");
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
