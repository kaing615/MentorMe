import createPrivateClient from "../clients/private.client.js";
import { normalizeFavorites } from "../../utils/engagement-response";

export type FavoriteType = "course" | "mentor";

const client = createPrivateClient();

const favoriteApi = {
  list: async () => normalizeFavorites(await client.get("/favorites")),
  add: (type: FavoriteType, id: string) =>
    client.post(`/favorites/${type}/${id}`),
  remove: (type: FavoriteType, id: string) =>
    client.delete(`/favorites/${type}/${id}`),
};

export default favoriteApi;
