import { apiClient } from "../clients/api.client";

const adminApi = {
  me: () => apiClient.get("/admin/me"),
  overview: () => apiClient.get("/admin/overview"),
  audit: (params = {}) => apiClient.get("/admin/audit", { params }),
  users: (params = {}) => apiClient.get("/admin/users", { params }),
  suspendUser: (id: string, reason: string) => apiClient.patch(`/admin/users/${id}/suspend`, { reason }),
  restoreUser: (id: string) => apiClient.patch(`/admin/users/${id}/restore`),
  grantAdmin: (id: string) => apiClient.patch(`/admin/users/${id}/grant-admin`),
  revokeAdmin: (id: string) => apiClient.patch(`/admin/users/${id}/revoke-admin`),
  updateProfile: (data: { firstName: string; lastName: string }) => apiClient.patch("/admin/settings/profile", data),
  changeEmail: (data: { email: string; currentPassword: string }) => apiClient.patch("/admin/settings/email", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => apiClient.patch("/admin/settings/password", data),
  mentorApplications: (status = "pending") =>
    apiClient.get("/user/admin/mentor-applications", { params: { status } }),
  reviewMentorApplication: (
    id: string,
    status: "approved" | "rejected",
    reason = "",
  ) => apiClient.patch(`/user/admin/mentor-applications/${id}`, { status, reason }),
  processBookingRefund: (id: string, refundReference: string) =>
    apiClient.patch(`/booking/admin/${id}/refund`, { refundReference }),
  refunds: () =>
    apiClient.get("/booking", { params: { status: "cancelled", limit: 100 } }),
  sessions: (params = {}) => apiClient.get("/booking", { params }),
  updateSessionNotes: (id: string, notes: string) => apiClient.patch(`/booking/${id}`, { notes }),
  cancelSession: (id: string, reason: string) => apiClient.post(`/booking/admin/${id}/cancel`, { reason }),
  courses: (params = {}) => apiClient.get("/course/admin", { params }),
  suspendCourse: (id: string, reason: string) => apiClient.patch(`/course/admin/${id}/suspend`, { reason }),
  restoreCourse: (id: string) => apiClient.patch(`/course/admin/${id}/restore`),
  helpRequests: (params = {}) => apiClient.get("/help/help-requests", { params }),
  respondHelpRequest: (id: string, adminResponse: string, status: string) => apiClient.post(`/help/help-requests/${id}/respond`, { adminResponse, status }),
  retryHelpEmail: (id: string) => apiClient.post(`/help/help-requests/${id}/retry-email`),
};

export default adminApi;
