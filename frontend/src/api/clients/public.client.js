import axios from "axios";
import { apiBaseUrl } from "../../config/runtime.js";

const publicClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  paramsSerializer: (params) => {
    // Sử dụng URLSearchParams để serialize một cách an toàn
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },
});

publicClient.interceptors.request.use(
  (config) => {
    // Chỉ set Content-Type là application/json khi không phải FormData
    const headers = {
      ...config.headers,
    };

    // Nếu data không phải FormData thì mới set Content-Type là application/json
    if (!(config.data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    config.headers = headers;
    return config;
  },
  (error) => Promise.reject(error)
);

publicClient.interceptors.response.use(
  (response) => response?.data || response,
  (error) => {
    throw error?.response?.data || error;
  }
);

export default publicClient;
