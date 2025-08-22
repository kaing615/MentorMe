// src/api/clients/private.client.js
import axios from "axios";
import queryString from "query-string";
import { logout } from "../../redux/features/auth.slice.js";

const API_ROOT = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const baseURL = /\/api\/v1$/i.test(API_ROOT) ? API_ROOT : `${API_ROOT}/api/v1`;

const createPrivateClient = (dispatch) => {
  const client = axios.create({
    baseURL,
    paramsSerializer: { encode: (params) => queryString.stringify(params) },
  });

  client.interceptors.request.use((config) => {
    const isFormData = config.data instanceof FormData;
    config.headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...config.headers,
    };

    // Ưu tiên sessionStorage, fallback localStorage
    const raw = sessionStorage.getItem("actkn") || localStorage.getItem("actkn");
    // Làm sạch nếu lỡ lưu kèm "Bearer " hoặc có dấu "
    const token = raw?.replace(/^Bearer\s+/i, "")?.replace(/^"|"$/g, "");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    else delete config.headers.Authorization;

    return config;
  });

  client.interceptors.response.use(
    (res) => (res && res.data ? res.data : res),
    (error) => {
      const status = error.response?.status;
      if (status === 401) {
        console.warn("401 Unauthorized – logging out");
        dispatch?.(logout());
        window.location.href = "/auth/signin";
        return;
      }
      if (status === 403) {
        console.warn("403 Forbidden – insufficient permission");
      }
      throw error.response?.data || error;
    }
  );

  return client;
};

export default createPrivateClient;
