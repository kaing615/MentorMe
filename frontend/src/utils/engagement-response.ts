export type FavoriteCourse = {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  category?: string | string[];
  rate?: number;
  mentor?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    avatarUrl?: string;
    jobTitle?: string;
  };
};

export type FavoriteMentor = {
  _id: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  avatarUrl?: string;
  jobTitle?: string;
  category?: string;
  skills?: string[];
  bio?: string;
};

export type AppNotification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt?: string | null;
  createdAt: string;
  actor?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role?: string;
  } | null;
  metadata?: Record<string, unknown>;
};

const dataOf = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== "object") return {};
  const value = payload as Record<string, unknown>;
  return value.data && typeof value.data === "object"
    ? (value.data as Record<string, unknown>)
    : value;
};

export const normalizeFavorites = (payload: unknown) => {
  const data = dataOf(payload);
  return {
    courses: Array.isArray(data.courses)
      ? (data.courses as FavoriteCourse[])
      : [],
    mentors: Array.isArray(data.mentors)
      ? (data.mentors as FavoriteMentor[])
      : [],
  };
};

export const normalizeNotifications = (payload: unknown) => {
  const data = dataOf(payload);
  return {
    items: Array.isArray(data.items) ? (data.items as AppNotification[]) : [],
    unreadCount:
      typeof data.unreadCount === "number" ? data.unreadCount : 0,
    total: typeof data.total === "number" ? data.total : 0,
    page: typeof data.page === "number" ? data.page : 1,
    limit: typeof data.limit === "number" ? data.limit : 20,
    hasMore: data.hasMore === true,
  };
};
