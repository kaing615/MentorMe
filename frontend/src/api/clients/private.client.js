import axios from "axios";
import queryString from "query-string";
import { logout } from "../../redux/features/auth.slice.js";

const baseURL = import.meta.env.VITE_API_URL;

const createPrivateClient = (dispatch) => {
  const privateClient = axios.create({
    baseURL,
    paramsSerializer: {
      encode: (params) => queryString.stringify(params),
    },
  });

  privateClient.interceptors.request.use(
    async (config) => {
      // Only set Content-Type if not FormData
      const isFormData = config.data instanceof FormData;
      config.headers = {
        ...config.headers,
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${localStorage.getItem("actkn")}`,
      };
      return config;
    },
    (error) => Promise.reject(error)
  );

  privateClient.interceptors.response.use(
    (response) => {
      if (response && response.data) {
        return response.data;
      }
      return response;
    },
    async (error) => {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          console.warn(
            "Authentication error: Token expired or invalid. Logging out..."
          );
          if (dispatch) {
            dispatch(logout());
          }
          window.location.href = "/auth/signin";
        }
      }
      throw error.response?.data || error;
    }
  );

  return privateClient;
};

export default createPrivateClient;
