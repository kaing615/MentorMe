import { apiClient } from "../clients/api.client";

const bookingEndpoints = {
  create: (mentorId) => `/booking/mentor/${mentorId}`,
  getAll: "/booking",
  getMentorBookings: "/booking/mentor",
  getMenteeBookings: "/booking/mentee",
  confirm: (id) => `/booking/confirm/${id}`,
  decline: (id) => `/booking/decline/${id}`,
  finish: (id) => `/booking/finish/${id}`,
  cancel: (id) => `/booking/cancel/${id}`,
  update: (id) => `/booking/${id}`,
  delete: (id) => `/booking/${id}`,
};

const bookingApi: any = {

  createBooking: async (mentorId, data) => {
    try {
      const response = await apiClient.post(
        bookingEndpoints.create(mentorId),
        data
      );
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  getAllBookings: async (params = {}) => {
    try {
      const response = await apiClient.get(bookingEndpoints.getAll, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  getMentorBookings: async (params = {}) => {
    try {
      const response = await apiClient.get(bookingEndpoints.getMentorBookings, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  getMenteeBookings: async (params = {}) => {
    try {
      const response = await apiClient.get(bookingEndpoints.getMenteeBookings, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  confirmBooking: async (bookingId, meetingLink = "") => {
    try {
      const response = await apiClient.post(bookingEndpoints.confirm(bookingId), {
        ...(meetingLink ? { meetingLink } : {}),
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  declineBooking: async (bookingId, reason = "") => {
    try {
      const response = await apiClient.post(bookingEndpoints.decline(bookingId), {
        reason,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  finishBooking: async (bookingId) => {
    try {
      const response = await apiClient.post(bookingEndpoints.finish(bookingId));
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  cancelBooking: async (bookingId, reason = "") => {
    try {
      const response = await apiClient.post(bookingEndpoints.cancel(bookingId), {
        reason,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  updateBooking: async (bookingId, data) => {
    try {
      const response = await apiClient.patch(
        bookingEndpoints.update(bookingId),
        data
      );
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  deleteBooking: async (bookingId) => {
    try {
      const response = await apiClient.delete(bookingEndpoints.delete(bookingId));
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },
};

export default bookingApi;
