import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../redux/features/user.slice";
import {
  IconBell,
  IconHeart,
  IconSearch,
  IconShoppingBag,
} from "@tabler/icons-react";
import SearchDropdown from "./SearchDropdown";

const Header = () => {
  // Dropdown state for avatar
  const [showAvatarDropdown, setShowAvatarDropdown] = useState<any>(false);

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
      // Nếu đã đăng nhập, set dựa trên role của user
      let userRole = null;
      try {
        const userData = localUser ? JSON.parse(localUser) : user;
        userRole = userData?.role;
      } catch (e) {
        console.error("Error parsing user data:", e);
      }

      if (userRole) {
        const shouldShowCategories = userRole === "mentor";
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

  const handleAPICall = (id, action) => {
    console.log(`API Call - ID: ${id}, Action: ${action}`);
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_92%,transparent)] backdrop-blur-xl">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 lg:px-8">
          <div className="flex h-16 flex-nowrap items-center gap-2 md:gap-4 lg:gap-6">
            <button
              type="button"
              className="flex h-10 shrink-0 items-center px-1 text-lg font-extrabold tracking-[-0.03em] text-[var(--ui-text)] transition-colors hover:text-[var(--ui-accent)] md:text-xl"
              onClick={() => {
                localStorage.setItem("mentorMode", "false");
                setShowCategories(false);
                if (isLoggedIn) {
                  const userData = localUser ? JSON.parse(localUser) : user;
                  const userRole = userData?.role;
                  if (userRole === "mentor") {
                    setShowCategories(true);
                    localStorage.setItem("mentorMode", "true");
                    navigate("/mentor/home");
                  } else {
                    setShowCategories(false);
                    localStorage.setItem("mentorMode", "false");
                    navigate("/home");
                  }
                } else {
                  navigate("/auth/signin");
                }
              }}
            >
              MentorMe
            </button>
            <button
              onClick={handleMentorClick}
              className="hidden h-10 items-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-accent-soft)] hover:text-[var(--ui-accent)] lg:inline-flex"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] sm:hidden"
              onClick={() => navigate("/platform/search")}
            >
              <IconSearch aria-hidden="true" size={21} stroke={1.8} />
            </button>
            <div className="hidden h-10 shrink-0 items-center whitespace-nowrap px-2 text-sm font-medium text-[var(--ui-text-muted)] xl:flex">
              Mentor with MentorMe
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/auth/signin");
                    }}
                    className="hidden h-10 items-center whitespace-nowrap rounded-lg border border-[var(--ui-border)] bg-transparent px-4 text-sm font-semibold text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)] sm:flex"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem("mentorMode", "false");
                      setShowCategories(false);
                      navigate("/auth/signup");
                    }}
                    className="flex h-10 items-center whitespace-nowrap rounded-lg bg-[var(--ui-text)] px-4 text-sm font-bold text-[var(--ui-surface)] transition-opacity hover:opacity-85"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Favorites"
                    className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)] lg:inline-flex"
                    onClick={() => handleAPICall("demo-mentor-id", "Favorite")}
                  >
                    <IconHeart aria-hidden="true" size={21} stroke={1.8} />
                  </button>
                  <button
                    type="button"
                    aria-label="Shopping cart"
                    className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)] lg:inline-flex"
                    onClick={() => handleAPICall("cart-mentor-id", "Cart")}
                  >
                    <IconShoppingBag aria-hidden="true" size={21} stroke={1.8} />
                  </button>
                  <button
                    type="button"
                    aria-label="Notifications"
                    className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-accent)] lg:inline-flex"
                    onClick={() => handleAPICall("bell-mentor-id", "Bell")}
                  >
                    <IconBell aria-hidden="true" size={21} stroke={1.8} />
                  </button>
                  {/* Avatar: mở dropdown khi click */}
                  <div className="relative header-avatar-dropdown">
                    <button
                      type="button"
                      aria-label="Open account menu"
                      className="inline-flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded-full bg-[var(--ui-text)] text-base font-bold text-[var(--ui-surface)] transition-opacity hover:opacity-85"
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
                            if (userRole === "mentor") {
                              navigate("/mentor/profile");
                            } else {
                              navigate("/profile");
                            }
                          }}
                        >
                          Profile
                        </button>
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
      <Outlet />
    </>
  );
};

export default Header;
