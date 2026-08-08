/**
 * General API Client for authenticated requests
 * Sử dụng cho các API calls cần authentication token
 */

import axios from "axios";
import queryString from "query-string";
import { apiBaseUrl } from "../../config/runtime.js";

// Tạo axios instance
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  paramsSerializer: { encode: (params) => queryString.stringify(params) },
});

// Request interceptor - tự động thêm Authorization header
apiClient.interceptors.request.use((config) => {
  const isFormData = config.data instanceof FormData;
  
  // Set content type cho non-FormData requests
  config.headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...config.headers,
  };

  // Lấy token từ storage (ưu tiên sessionStorage)
  const raw = sessionStorage.getItem("actkn") || localStorage.getItem("actkn");
  const token = raw?.replace(/^Bearer\s+/i, "")?.replace(/^"|"$/g, "");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
