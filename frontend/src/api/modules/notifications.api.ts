import createPrivateClient from "../clients/private.client.js";
import { normalizeNotifications } from "../../utils/engagement-response";

const client = createPrivateClient();

const notificationApi = {
  list: async () => normalizeNotifications(await client.get("/notifications")),
  markRead: (id: string) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.patch("/notifications/read-all"),
};

export default notificationApi;
