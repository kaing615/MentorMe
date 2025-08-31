import axios from "axios";
import queryString from "query-string";

const raw = import.meta.env.VITE_API_URL || "http://localhost:4000";
const base = raw.replace(/\/$/, ""); // bỏ dấu / cuối nếu có
const baseURL = `${base}/api/v1`;    // ✅ luôn có /api/v1

const publicClient = axios.create({
    baseURL,
    paramsSerializer: {
        encode: (params) => queryString.stringify(params),
    },
});

publicClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('actkn');
        
        // Chỉ set Content-Type là application/json khi không phải FormData
        const headers = {
            ...config.headers,
            ...(token && { "Authorization": `Bearer ${token}` }),
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

export default privateClient;
