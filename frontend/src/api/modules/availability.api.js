import axios from "axios";

// Tự động thêm token cho mọi request
axios.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("actkn") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("actkn");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const availabilityEndpoints = {
  create: "/api/v1/availability",
  todaySchedule: "/api/v1/availability/today-schedule",
  mentorRange: "/api/v1/availability/mentor/range",
  mentorPublic: (mentorId) => `/api/v1/availability/mentor/${mentorId}/public`,
  overview: "/api/v1/availability/overview",
  mySchedules: "/api/v1/availability/my-schedules",
  delete: (availabilityId) => `/api/v1/availability/${availabilityId}`,
  cleanupOld: "/api/v1/availability/cleanup-old",
};

const availabilityApi = {
  // Mentor tạo hoặc cập nhật availability cho một ngày
  createOrUpdateAvailability: async (data) => {
    try {
      const response = await axios.post(availabilityEndpoints.create, data);
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy lịch chi tiết trong ngày của mentor
  getTodaySchedule: async (date) => {
    try {
      const params = date ? { date } : {};
      const response = await axios.get(availabilityEndpoints.todaySchedule, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy availability của mentor trong khoảng thời gian
  getMentorAvailabilityRange: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(availabilityEndpoints.mentorRange, {
        params,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Mentee lấy availability của mentor để booking (public view)
  getMentorPublicAvailability: async (mentorId, startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Add cache-busting parameter
      params._t = Date.now();

      const response = await axios.get(
        availabilityEndpoints.mentorPublic(mentorId),
        {
          params,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy availability overview của mentor trong 7 ngày tới
  getAvailabilityOverview: async () => {
    try {
      const response = await axios.get(availabilityEndpoints.overview);
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy danh sách tất cả schedules của mentor
  getMySchedules: async () => {
    try {
      const response = await axios.get(availabilityEndpoints.mySchedules);
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Xóa availability
  deleteAvailability: async (availabilityId) => {
    try {
      const response = await axios.delete(
        availabilityEndpoints.delete(availabilityId)
      );
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Manual cleanup old availabilities (Admin only)
  cleanupOldAvailabilities: async (daysBack = 3) => {
    try {
      const response = await axios.post(availabilityEndpoints.cleanupOld, {
        daysBack,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },
};

export default availabilityApi;
