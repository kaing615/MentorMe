import axios from "axios";

// Thêm interceptor để tự động gửi token cho mọi request
axios.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("actkn") ||
    localStorage.getItem("token");
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

export const helpApi: any = {
	// Public endpoints - không cần authentication
	createHelpRequest: async (data) => {
		const response = await axios.post(helpEndpoints.createHelpRequest, data);
		return response.data;
	},
	
	getHelpRequestByTicket: async (ticketNumber) => {
		const response = await axios.get(helpEndpoints.getHelpRequestByTicket(ticketNumber));
		return response.data;
	},

	// Private endpoints - cần authentication
	getMyHelpRequests: async () => {
		const response = await axios.get(helpEndpoints.getMyHelpRequests);
		return response.data;
	},
	
	getAllHelpRequests: async (params) => {
		const response = await axios.get(helpEndpoints.getAllHelpRequests, { params });
		return response.data;
	},
	
	getHelpRequestById: async (id) => {
		const response = await axios.get(helpEndpoints.getHelpRequestById(id));
		return response.data;
	},
	
	updateHelpRequest: async (id, data) => {
		const response = await axios.put(helpEndpoints.updateHelpRequest(id), data);
		return response.data;
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
