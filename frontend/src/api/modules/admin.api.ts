import { apiClient } from "../clients/api.client";

const adminApi = {
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
};

export default adminApi;
