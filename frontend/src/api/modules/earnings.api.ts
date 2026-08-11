import { apiClient } from "../clients/api.client";

const earningsApi = {
  mine: () => apiClient.get("/mentor-earnings"),
  admin: (params = {}) => apiClient.get("/mentor-earnings/admin", { params }),
  markPaid: (id: string, payoutReference: string) =>
    apiClient.patch(`/mentor-earnings/admin/${id}/paid`, { payoutReference }),
};

export default earningsApi;
