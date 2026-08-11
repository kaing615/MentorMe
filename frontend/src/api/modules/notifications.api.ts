import createPrivateClient from "../clients/private.client.js";
import { normalizeNotifications } from "../../utils/engagement-response";

const client = createPrivateClient();

const notificationApi = {
  list: async (params?: { page?: number; limit?: number }) =>
    normalizeNotifications(await client.get("/notifications", { params })),
  markRead: (id: string) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.patch("/notifications/read-all"),
};

export default notificationApi;
