import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../redux/features/user.slice";
import {
  IconHeart,
  IconMoonStars,
  IconSearch,
  IconShoppingBag,
  IconSun,
} from "@tabler/icons-react";
import SearchDropdown from "./SearchDropdown";
import BrandLogo from "./BrandLogo";
import { applyTheme, getInitialTheme, type Theme } from "../../utils/theme";
import { hasUserRole } from "../../utils/user-role";
import {
  getHeaderActionTarget,
  shouldShowMenteeHeaderActions,
  type HeaderAction,
} from "../../utils/header-navigation";
import NotificationPopover from "./NotificationPopover";
import { getAuthTransitionPlan } from "../../utils/auth-transition";

gsap.registerPlugin(useGSAP);

const Header = () => {
  // Dropdown state for avatar
  const [showAvatarDropdown, setShowAvatarDropdown] = useState<any>(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!showAvatarDropdown) return;
    const handleClick = (e) => {
      if (!e.target.closest(".header-avatar-dropdown")) {
        setShowAvatarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAvatarDropdown]);
  const [showCategories, setShowCategories] = useState<any>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const authRouteRef = useRef<HTMLDivElement>(null);
  const authTransitioningRef = useRef(false);
  const isAnimatedAuthRoute =
    location.pathname === "/auth/signin" ||
    location.pathname === "/auth/signup";

  const navigateToAuth = (targetPath: "/auth/signin" | "/auth/signup") => {
    if (location.pathname === targetPath || authTransitioningRef.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plan = getAuthTransitionPlan(targetPath, reduceMotion);
    const route = authRouteRef.current;

    if (!isAnimatedAuthRoute || !route || plan.exitDuration === 0) {
      navigate(targetPath);
      return;
    }

    authTransitioningRef.current = true;
    gsap.killTweensOf(route);
    gsap.to(route, {
      autoAlpha: 0,
      x: plan.exitX,
      scale: 0.995,
      duration: plan.exitDuration,
      ease: "power2.inOut",
      onComplete: () => navigate(targetPath),
    });
  };

  useGSAP(
    () => {
      const route = authRouteRef.current;
      if (!isAnimatedAuthRoute || !route) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const plan = getAuthTransitionPlan(location.pathname, reduceMotion);
      authTransitioningRef.current = false;
      gsap.killTweensOf(route);

      if (plan.enterDuration === 0) {
        gsap.set(route, { clearProps: "all" });
        return;
      }

      gsap.fromTo(
        route,
        { autoAlpha: 0, x: plan.enterX, scale: 0.995 },
        {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          duration: plan.enterDuration,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
        },
      );
    },
    { dependencies: [location.pathname], scope: authRouteRef },
  );

  // Get user data from Redux store
  const user = useSelector((state: any) => state.user);
  const localLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const localUser = localStorage.getItem("user");
  const localToken =
    localStorage.getItem("actkn") || localStorage.getItem("token");
  const displayUser = (() => {
    try {
      return localUser ? JSON.parse(localUser) : user;
    } catch {
      return user;
    }
  })();

  // Improved authentication check - persistent across tabs and sessions
  const isLoggedIn =
    (user?.isLoggedIn && localLoggedIn && localUser && localToken) ||
    (localLoggedIn && localUser && localToken && !user?.isLoggedIn);

  // Khởi tạo trạng thái header từ localStorage khi component mount
  useEffect(() => {
    const savedMentorMode = localStorage.getItem("mentorMode");
    if (savedMentorMode !== null) {
      setShowCategories(savedMentorMode === "true");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const savedMentorMode = localStorage.getItem("mentorMode");
      // Nếu đã đăng nhập, set dựa trên role của user
      let userRole = null;
      let userData = user;
      try {
        userData = localUser ? JSON.parse(localUser) : user;
        userRole = userData?.role;
      } catch (e) {
        console.error("Error parsing user data:", e);
      }

      if (userRole) {
        const hasBothRoles =
          hasUserRole(userData, "mentor") && hasUserRole(userData, "mentee");
        const shouldShowCategories = hasBothRoles && savedMentorMode !== null
          ? savedMentorMode === "true"
          : userRole === "mentor";
        setShowCategories(shouldShowCategories);
        localStorage.setItem("mentorMode", shouldShowCategories.toString());

        // NOTE: Removed cross-user localStorage cleanup for production safety
        // Instead, each user should have their own storage keys or use sessionStorage
      }
    } else {
      // Nếu chưa đăng nhập, set dựa trên current path
      const currentPath = location.pathname;
      const shouldShowCategories =
        currentPath.includes("/auth/signin") ||
        currentPath.includes("/auth/apply-as-men");
      setShowCategories(shouldShowCategories);
      localStorage.setItem("mentorMode", shouldShowCategories.toString());
    }

    const handleStorageChange = (e) => {
      if (e.key === "mentorMode" && !isLoggedIn) {
        // Chỉ cập nhật khi chưa đăng nhập
        setShowCategories(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [location.pathname, isLoggedIn, localUser, user]);

  const handleHeaderAction = (action: HeaderAction) => {
    const target = getHeaderActionTarget(
      action,
      showCategories && hasUserRole(displayUser, "mentor"),
    );
    navigate(target.path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    // Clear user data using Redux action (will also clear localStorage)
    dispatch(clearUser());
    navigate("/");
  };

  // Handle mentor button click
  const handleMentorClick = () => {
    navigate("/all-mentors");
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] shadow-[var(--ui-shadow-sm)] backdrop-blur-xl">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 lg:px-8">
          <div className="flex h-[4.5rem] flex-nowrap items-center gap-2 md:gap-4 lg:gap-6">
            <button
              type="button"
              aria-label="Go to MentorMe home"
              className="flex shrink-0 items-center rounded-xl px-1 py-1 transition-opacity hover:opacity-80"
              onClick={() => {
                localStorage.setItem("mentorMode", "false");
                setShowCategories(false);
                if (isLoggedIn) {
                  const userData = localUser ? JSON.parse(localUser) : user;
                  const userRole = userData?.role;
                  if (
                    userRole === "mentor" &&
                    !(hasUserRole(userData, "mentee") && !showCategories)
                  ) {
                    setShowCategories(true);
                    localStorage.setItem("mentorMode", "true");
                    navigate("/mentor/home");
                  } else {
                    setShowCategories(false);
                    localStorage.setItem("mentorMode", "false");
                    navigate("/home");
                  }
                } else {
                  navigateToAuth("/auth/signin");
                }
              }}
            >
              <BrandLogo />
            </button>
            <button
              onClick={handleMentorClick}
              className="hidden h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-accent-soft)] hover:text-[var(--ui-accent)] lg:inline-flex"
            >
              {showCategories ? "Categories" : "Mentors"}
            </button>
            <div className="hidden min-w-0 flex-1 sm:block">
              <div className="flex w-full max-w-2xl items-center gap-2">
                <SearchDropdown />
              </div>
            </div>
            <button
              type="button"
              aria-label="Open search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] sm:hidden"
              onClick={() => navigate("/platform/search")}
            >
              <IconSearch aria-hidden="true" size={21} stroke={1.8} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/auth/apply-as-men")}
              className="hidden h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-[var(--ui-surface-muted)] px-4 text-sm font-semibold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-accent-soft)] hover:text-[var(--ui-accent)] xl:flex"
            >
              Mentor with MentorMe
            </button>
            <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
              <button
                type="button"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-pressed={theme === "dark"}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)]"
                onClick={handleThemeToggle}
              >
                {theme === "dark" ? (
                  <IconSun aria-hidden="true" size={21} stroke={1.8} />
                ) : (
                  <IconMoonStars aria-hidden="true" size={21} stroke={1.8} />
                )}
              </button>
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      navigateToAuth("/auth/signin");
                    }}
                    className="hidden h-11 items-center whitespace-nowrap rounded-full bg-[var(--ui-surface-muted)] px-5 text-sm font-semibold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-accent-soft)] sm:flex"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem("mentorMode", "false");
                      setShowCategories(false);
                      navigateToAuth("/auth/signup");
                    }}
                    className="flex h-11 items-center whitespace-nowrap rounded-full bg-[var(--ui-accent-fill)] px-5 text-sm font-bold text-white shadow-[var(--ui-shadow-sm)] transition-colors hover:bg-[var(--ui-accent-fill-hover)]"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {shouldShowMenteeHeaderActions(displayUser, showCategories) && (
                    <>
                      <button
                        type="button"
                        aria-label="Favorites"
                        title="Favorites"
                        className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)] lg:inline-flex"
                        onClick={() => handleHeaderAction("favorites")}
                      >
                        <IconHeart aria-hidden="true" size={21} stroke={1.8} />
                      </button>
                      <button
                        type="button"
                        aria-label="Shopping cart"
                        title="Shopping cart"
                        className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)] lg:inline-flex"
                        onClick={() => handleHeaderAction("cart")}
                      >
                        <IconShoppingBag aria-hidden="true" size={21} stroke={1.8} />
                      </button>
                    </>
                  )}
                  <NotificationPopover />
                  {/* Avatar: mở dropdown khi click */}
                  <div className="relative header-avatar-dropdown">
                    <button
                      type="button"
                      aria-label="Open account menu"
                      className="inline-flex h-11 w-11 cursor-pointer select-none items-center justify-center rounded-full bg-[var(--ui-text)] text-base font-bold text-[var(--ui-surface)] transition-opacity hover:opacity-85"
                      onClick={() => setShowAvatarDropdown((v) => !v)}
                      title="Account menu"
                    >
                      {displayUser?.firstName?.charAt(0).toUpperCase() || "U"}
                    </button>
                    {showAvatarDropdown && (
                      <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow)]">
                        <button
                          className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--ui-text)] hover:bg-[var(--ui-surface-muted)]"
                          onClick={() => {
                            setShowAvatarDropdown(false);
                            const userData = localUser
                              ? JSON.parse(localUser)
                              : user;
                            const userRole = userData?.role;
                            if (
                              userRole === "mentor" &&
                              !(hasUserRole(userData, "mentee") && !showCategories)
                            ) {
                              navigate("/mentor/profile");
                            } else {
                              navigate("/profile");
                            }
                          }}
                        >
                          Profile
                        </button>
                        {hasUserRole(displayUser, "mentor") &&
                          hasUserRole(displayUser, "mentee") && (
                            <button
                              className="w-full border-t border-[var(--ui-border)] px-4 py-3 text-left text-sm font-medium text-[var(--ui-text)] hover:bg-[var(--ui-surface-muted)]"
                              onClick={() => {
                                const mentorMode = !showCategories;
                                setShowAvatarDropdown(false);
                                setShowCategories(mentorMode);
                                localStorage.setItem("mentorMode", String(mentorMode));
                                navigate(mentorMode ? "/mentor/home" : "/home");
                              }}
                            >
                              Chuyển sang {showCategories ? "Mentee" : "Mentor"}
                            </button>
                          )}
                        <button
                          className="w-full border-t border-[var(--ui-border)] px-4 py-3 text-left text-sm font-medium text-[var(--ui-text)] hover:bg-[var(--ui-surface-muted)]"
                          onClick={() => {
                            setShowAvatarDropdown(false);
                            handleLogout();
                          }}
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {isAnimatedAuthRoute ? (
        <div ref={authRouteRef} className="overflow-x-clip will-change-transform">
          <Outlet />
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default Header;
