export type NotificationTarget = {
  path: string;
  storageKey?: "menteeProfileTab" | "mentorProfileTab";
  tab?: string;
};

export const getNotificationTarget = (
  type: string,
  mentorMode: boolean,
  fallback?: string,
): NotificationTarget => {
  if (type === "message_received") {
    return mentorMode
      ? { path: "/mentor/profile", storageKey: "mentorProfileTab", tab: "messages" }
      : { path: "/profile", storageKey: "menteeProfileTab", tab: "messages" };
  }
  if (type === "booking_created") {
    return {
      path: "/mentor/profile",
      storageKey: "mentorProfileTab",
      tab: "response",
    };
  }
  if (type === "review_received") {
    return {
      path: "/mentor/profile",
      storageKey: "mentorProfileTab",
      tab: "reviews",
    };
  }
  if (type.startsWith("booking_")) {
    return mentorMode
      ? { path: "/mentor/profile", storageKey: "mentorProfileTab", tab: "response" }
      : { path: "/profile", storageKey: "menteeProfileTab", tab: "mybookings" };
  }
  if (type.startsWith("payment_") || type === "course_completed") {
    return {
      path: "/profile",
      storageKey: "menteeProfileTab",
      tab: "mycourses",
    };
  }
  return { path: fallback || (mentorMode ? "/mentor/home" : "/home") };
};
