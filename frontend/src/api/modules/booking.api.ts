import axios from "axios";

// Tự động thêm token cho mọi request
axios.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("actkn") ||
    localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const bookingEndpoints = {
  create: (mentorId) => `/api/v1/booking/mentor/${mentorId}`,
  getAll: "/api/v1/booking",
  getMentorBookings: "/api/v1/booking/mentor",
  getMenteeBookings: "/api/v1/booking/mentee",
  confirm: (id) => `/api/v1/booking/confirm/${id}`,
  cancel: (id) => `/api/v1/booking/cancel/${id}`,
  update: (id) => `/api/v1/booking/${id}`,
  delete: (id) => `/api/v1/booking/${id}`,
};

const bookingApi: any = {
  // Mentee tạo booking mới với mentor
  createBooking: async (mentorId, data) => {
    try {
      const response = await axios.post(
        bookingEndpoints.create(mentorId),
        data
      );
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy tất cả bookings (Admin only)
  getAllBookings: async (params = {}) => {
    try {
      const response = await axios.get(bookingEndpoints.getAll, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy bookings của mentor hiện tại
  getMentorBookings: async (params = {}) => {
    try {
      const response = await axios.get(bookingEndpoints.getMentorBookings, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy bookings của mentee hiện tại
  getMenteeBookings: async (params = {}) => {
    try {
      const response = await axios.get(bookingEndpoints.getMenteeBookings, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Mentor confirm booking
  confirmBooking: async (bookingId) => {
    try {
      const response = await axios.post(bookingEndpoints.confirm(bookingId));
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Cancel booking (mentor hoặc mentee)
  cancelBooking: async (bookingId, reason = "") => {
    try {
      const response = await axios.post(bookingEndpoints.cancel(bookingId), {
        reason,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Cập nhật booking (notes, etc)
  updateBooking: async (bookingId, data) => {
    try {
      const response = await axios.patch(
        bookingEndpoints.update(bookingId),
        data
      );
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Xóa booking (Admin only)
  deleteBooking: async (bookingId) => {
    try {
      const response = await axios.delete(bookingEndpoints.delete(bookingId));
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },
};

export default bookingApi;