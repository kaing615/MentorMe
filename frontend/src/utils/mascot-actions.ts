import type { UserRole } from "./user-role";

type MascotUser = {
  role?: UserRole;
  roles?: UserRole[];
} | null;

export type MascotAction = {
  key: "mentor" | "courses" | "bookings" | "messages" | "profile" | "signin" | "signup";
  label: string;
  description: string;
  path: string;
  storageKey?: "menteeProfileTab" | "mentorProfileTab";
  tab?: string;
};

const hasRole = (user: MascotUser, role: UserRole) =>
  user?.role === role || user?.roles?.includes(role) === true;

export const getMascotActions = (
  user: MascotUser,
  mentorMode: boolean,
): MascotAction[] => {
  if (
    hasRole(user, "mentor") &&
    (mentorMode || !hasRole(user, "mentee"))
  ) {
    return [
      {
        key: "bookings",
        label: "Manage bookings",
        description: "Review and respond to session requests",
        path: "/mentor/dashboard",
        storageKey: "mentorProfileTab",
        tab: "response",
      },
      {
        key: "courses",
        label: "My courses",
        description: "Create and manage your learning content",
        path: "/mentor/dashboard",
        storageKey: "mentorProfileTab",
        tab: "mycourses",
      },
      {
        key: "messages",
        label: "Messages",
        description: "Continue conversations with mentees",
        path: "/mentor/dashboard",
        storageKey: "mentorProfileTab",
        tab: "messages",
      },
      {
        key: "profile",
        label: "Profile",
        description: "Keep your mentor profile polished",
        path: "/mentor/dashboard",
        storageKey: "mentorProfileTab",
        tab: "profile",
      },
    ];
  }
  if (hasRole(user, "mentee")) {
    return [
      {
        key: "mentor",
        label: "Find a mentor",
        description: "Meet experts matched to your goals",
        path: "/all-mentors",
      },
      {
        key: "courses",
        label: "Browse courses",
        description: "Explore practical learning paths",
        path: "/all-courses",
      },
      {
        key: "bookings",
        label: "My bookings",
        description: "Check upcoming mentoring sessions",
        path: "/profile",
        storageKey: "menteeProfileTab",
        tab: "mybookings",
      },
      {
        key: "messages",
        label: "Messages",
        description: "Continue conversations with mentors",
        path: "/profile",
        storageKey: "menteeProfileTab",
        tab: "messages",
      },
    ];
  }
  return [
    {
      key: "signin",
      label: "Sign in",
      description: "Continue your learning journey",
      path: "/auth/signin",
    },
    {
      key: "signup",
      label: "Create an account",
      description: "Start finding guidance that fits",
      path: "/auth/signup",
    },
  ];
};
