// src/api/clients/private.client.js
import axios from "axios";
import { logout } from "../../redux/features/auth.slice.js";
import { apiBaseUrl } from "../../config/runtime.js";
import {
  clearAccessToken,
  createRefreshCoordinator,
  getAccessToken,
  setAccessToken,
} from "../../auth/session.js";

const createPrivateClient = (dispatch) => {
  const client = axios.create({
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

  client.interceptors.request.use((config) => {
    const isFormData = config.data instanceof FormData;
    config.headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...config.headers,
    };

    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  });

  const refreshSession = createRefreshCoordinator(async () => {
    const response = await axios.post(
      `${apiBaseUrl}/user/refresh`,
      {},
      { withCredentials: true }
    );
    const token = response.data?.data?.token;
    if (!token) throw new Error("Refresh response did not contain an access token");
    setAccessToken(token);
    return token;
  });

  client.interceptors.response.use(
    (res) => (res && res.data ? res.data : res),
    async (error) => {
      const status = error.response?.status;
      const original = error.config;
      if (status === 401 && original && !original._retry) {
        original._retry = true;
        try {
          const token = await refreshSession();
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        } catch {
          clearAccessToken();
          dispatch?.(logout());
          window.location.href = "/auth/signin";
          return Promise.reject(error);
        }
      }
      if (status === 403) {
        console.warn("403 Forbidden – insufficient permission");
      }
      return Promise.reject(error.response?.data || error);
    }
  );

  return client;
};

export default createPrivateClient;
