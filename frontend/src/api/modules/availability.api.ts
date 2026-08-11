import { apiClient } from "../clients/api.client";

const availabilityEndpoints = {
  create: "/availability",
  todaySchedule: "/availability/today-schedule",
  mentorRange: "/availability/mentor/range",
  mentorPublic: (mentorId) => `/availability/mentor/${mentorId}/public`,
  overview: "/availability/overview",
  mySchedules: "/availability/my-schedules",
  delete: (availabilityId) => `/availability/${availabilityId}`,
  cleanupOld: "/availability/cleanup-old",
};

const availabilityApi: any = {
  // Mentor tạo hoặc cập nhật availability cho một ngày
  createOrUpdateAvailability: async (data) => {
    try {
      const response = await apiClient.post(availabilityEndpoints.create, data);
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy lịch chi tiết trong ngày của mentor
  getTodaySchedule: async (date) => {
    try {
      const params = date ? { date } : {};
      const response = await apiClient.get(availabilityEndpoints.todaySchedule, {
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
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get(availabilityEndpoints.mentorRange, {
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
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Add cache-busting parameter
      params._t = Date.now();

      const response = await apiClient.get(
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
      const response = await apiClient.get(availabilityEndpoints.overview);
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Lấy danh sách tất cả schedules của mentor
  getMySchedules: async () => {
    try {
      const response = await apiClient.get(availabilityEndpoints.mySchedules);
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },

  // Xóa availability
  deleteAvailability: async (availabilityId) => {
    try {
      const response = await apiClient.delete(
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
      const response = await apiClient.post(availabilityEndpoints.cleanupOld, {
        daysBack,
      });
      return { response: response.data };
    } catch (err) {
      return { error: err.response?.data || err };
    }
  },
};

export default availabilityApi;
