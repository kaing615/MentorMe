export type NotificationTarget = {
  path: string;
  storageKey?: "menteeProfileTab" | "mentorProfileTab";
  tab?: string;
};

export const getNotificationTarget = (
  type: string,
  mentorMode: boolean,
  fallback?: string,
  metadata?: Record<string, unknown>,
): NotificationTarget => {
  if (type === "message_received") {
    return mentorMode
      ? { path: "/mentor/dashboard", storageKey: "mentorProfileTab", tab: "messages" }
      : { path: "/profile", storageKey: "menteeProfileTab", tab: "messages" };
  }
  if (type === "booking_created") {
    return {
      path: "/mentor/dashboard",
      storageKey: "mentorProfileTab",
      tab: "response",
    };
  }
  if (type === "review_received") {
    return {
      path: "/mentor/dashboard",
      storageKey: "mentorProfileTab",
      tab: "reviews",
    };
  }
  if (type.startsWith("booking_")) {
    return mentorMode
      ? { path: "/mentor/dashboard", storageKey: "mentorProfileTab", tab: "response" }
      : { path: "/profile", storageKey: "menteeProfileTab", tab: "mybookings" };
  }
  if (type === "payment_failed") {
    const orderNumber = metadata?.orderNumber;
    return typeof orderNumber === "string" && orderNumber
      ? { path: `/order-detail?orderId=${encodeURIComponent(orderNumber)}` }
      : { path: "/profile", storageKey: "menteeProfileTab", tab: "orders" };
  }
  if (type === "payment_paid" || type === "course_completed") {
    return {
      path: "/profile",
      storageKey: "menteeProfileTab",
      tab: "mycourses",
    };
  }
  return { path: fallback || (mentorMode ? "/mentor/home" : "/home") };
};
