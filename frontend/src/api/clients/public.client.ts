import axios from "axios";
import { resolveApiBaseUrl } from "./base-url";

const baseURL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

const publicClient = axios.create({
  baseURL,
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
    const token = localStorage.getItem("actkn");

    // Chỉ set Content-Type là application/json khi không phải FormData
    if (token) config.headers.set("Authorization", `Bearer ${token}`);

    // Nếu data không phải FormData thì mới set Content-Type là application/json
    if (!(config.data instanceof FormData)) {
      config.headers.set("Content-Type", "application/json");
    }
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
