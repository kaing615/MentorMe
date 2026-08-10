export type HeaderAction = "favorites" | "cart" | "notifications";

type HeaderUser = {
  role?: "mentor" | "mentee" | "admin";
  roles?: Array<"mentor" | "mentee" | "admin">;
};

export const getHeaderActionTarget = (
  action: HeaderAction,
  mentorMode: boolean,
) => {
  void mentorMode;
  if (action === "favorites") return { path: "/favorites" };
  if (action === "cart") return { path: "/shoppingcart" };
  return { path: "/notifications" };
};

export const shouldShowMenteeHeaderActions = (
  user: HeaderUser | null,
  mentorMode: boolean,
) => {
  const isMentee =
    user?.role === "mentee" || user?.roles?.includes("mentee") === true;
  const isMentor =
    user?.role === "mentor" || user?.roles?.includes("mentor") === true;
  return isMentee && !(mentorMode && isMentor);
};
