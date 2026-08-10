import type { UserDocument } from "../../identity/user.schema";

export type UserRole = "mentor" | "mentee" | "admin";

export const hasUserRole = (user: UserDocument, role: UserRole): boolean =>
  user.role === role || user.roles?.includes(role) === true;
