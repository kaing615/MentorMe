import axios from "axios";
import queryString from "query-string";

const raw = import.meta.env.VITE_API_URL || "http://localhost:4000";
const base = raw.replace(/\/$/, ""); // bỏ dấu / cuối nếu có
const baseURL = `${base}/api/v1`;    // ✅ luôn có /api/v1

const privateClient = axios.create({
  baseURL,
  paramsSerializer: {
    encode: (params) => queryString.stringify(params),
  },
});

privateClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("actkn");

    const headers = {
      ...config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    if (!(config.data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    config.headers = headers;
    return config;
  },
  (error) => Promise.reject(error)
);

privateClient.interceptors.response.use(
  (response) => response?.data || response,
  (error) => {
    throw error?.response?.data || error;
  }
);

export default privateClient;
