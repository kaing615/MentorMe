import { getAccessToken } from "../../auth/session.js";
import axios from "axios";

// Thêm interceptor để tự động gửi token cho mọi request
axios.interceptors.request.use((config) => {
  const token =
    getAccessToken() ||
    getAccessToken() ||
    getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const helpEndpoints = {
	createHelpRequest: "/api/v1/help/help-requests",
	getHelpRequestByTicket: (ticketNumber) => `/api/v1/help/help-requests/ticket/${ticketNumber}`,
	getMyHelpRequests: "/api/v1/help/help-requests/my",
	getAllHelpRequests: "/api/v1/help/help-requests",
	getHelpRequestById: (id) => `/api/v1/help/help-requests/${id}`,
	updateHelpRequest: (id) => `/api/v1/help/help-requests/${id}`,
};

export const helpApi = {
	// Public endpoints - không cần authentication
	createHelpRequest: async (data) => {
		try {
			const response = await axios.post(helpEndpoints.createHelpRequest, data);
			return response.data;
		} catch (error) {
			throw error;
		}
	},
	
	getHelpRequestByTicket: async (ticketNumber) => {
		try {
			const response = await axios.get(helpEndpoints.getHelpRequestByTicket(ticketNumber));
			return response.data;
		} catch (error) {
			throw error;
		}
	},

	// Private endpoints - cần authentication
	getMyHelpRequests: async () => {
		try {
			const response = await axios.get(helpEndpoints.getMyHelpRequests);
			return response.data;
		} catch (error) {
			throw error;
		}
	},
	
	getAllHelpRequests: async (params) => {
		try {
			const response = await axios.get(helpEndpoints.getAllHelpRequests, { params });
			return response.data;
		} catch (error) {
			throw error;
		}
	},
	
	getHelpRequestById: async (id) => {
		try {  
			const response = await axios.get(helpEndpoints.getHelpRequestById(id));
			return response.data;
		} catch (error) {
			throw error;
		}
	},
	
	updateHelpRequest: async (id, data) => {
		try {
			const response = await axios.put(helpEndpoints.updateHelpRequest(id), data);
			return response.data;
		} catch (error) {
			throw error;
		}
	},
};

// Specific functions for ease of use
export const createHelpRequest = (data) => helpApi.createHelpRequest(data);
export const getHelpRequestByTicket = (ticketNumber) => helpApi.getHelpRequestByTicket(ticketNumber);
export const getMyHelpRequests = () => helpApi.getMyHelpRequests();
export const getAllHelpRequests = (params) => helpApi.getAllHelpRequests(params);
export const getHelpRequestById = (id) => helpApi.getHelpRequestById(id);
export const updateHelpRequest = (id, data) => helpApi.updateHelpRequest(id, data);

export default helpApi;
