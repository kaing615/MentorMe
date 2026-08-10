export type UserRole = "mentor" | "mentee" | "admin";

type UserWithRoles = {
  role?: UserRole;
  roles?: UserRole[];
};

export const hasUserRole = (user: UserWithRoles | null, role: UserRole): boolean =>
  user?.role === role || user?.roles?.includes(role) === true;
