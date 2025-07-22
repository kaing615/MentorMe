import axios from "axios";
import queryString from "query-string";

const baseURL = `http://localhost:4000/api/v1`;

const publicClient = axios.create({
    baseURL,
    paramsSerializer: {
        encode: (params) => queryString.stringify(params),
    },
});

publicClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('actkn');
        config.headers = {
            ...config.headers,
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
        };
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
