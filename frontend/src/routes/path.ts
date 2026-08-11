export const PATH = {
	NOT_FOUND: "*",
	AUTH: "/auth",
	LOGIN: "/auth/signin",
	ADMIN: "/admin",
	MENTEE: "/",
  MENTOR: "/mentor",
  PLATFORM: "/platform",
};

export const AUTH_PATH = {
  SIGNUP: "signup",
  SIGNIN: "signin",
  VERIFY_EMAIL: "verify-email",
  APPLY_AS_MENTOR: "apply-as-men",
};

export const MENTEE_PATH = {
  HOME: "home",
  COURSE: "course",
  PROFILE: "profile",
  SHOPPINGCART: "shoppingcart",
  COURSEDETAIL: "course-detail",
  ALLCOURSEPAGE: "all-courses",
  MENTOR: "mentor",
  ALLMENTORS: "all-mentors",
  FINDMENTOR: "find-mentor",
  ORDERCOMPLETECOURSE: "order-complete-course",
  CHECKOUT: "checkout",
  ORDERDETAIL: "order-detail",
  FAVORITES: "favorites",
};

export const ADMIN_PATH = {
  DASHBOARD: "dashboard",
};

export const MENTOR_PATH = {
  DASHBOARD: "dashboard",
  HOME: "home",
  PROFILE: "profile",
  HOMEPAGE: "homepage",
  CREATECOURSE: "create-course",
  COURSEDETAIL: "course-detail",
  EDITCOURSE: "edit-course",
  ALLCOURSE: "all-courses",
  ALLMENTORS: "all-mentors",
};

export const getRoleHomePath = (role?: string): string => {
  if (role === "mentor") return `${PATH.MENTOR}/${MENTOR_PATH.DASHBOARD}`;
  if (role === "admin") return PATH.ADMIN;
  if (role === "mentee") return `${PATH.MENTEE}${MENTEE_PATH.HOME}`;
  return PATH.LOGIN;
};

export const PLATFORM_PATH = {
	HOMESCREEN: "homescreen",
	HELP_REQUEST: "help-request",
  FINDMENTOR: "find-mentor",
  SEARCH: "search",
};
