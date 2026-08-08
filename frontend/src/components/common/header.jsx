import { clearAccessToken, getAccessToken } from "../../auth/session.js";
import authApi from "../../api/modules/auth.api.js";
import React, { useState, useEffect, use } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../redux/features/user.slice";
import { IoSearch, IoCartOutline } from "react-icons/io5";
import { FaRegHeart, FaRegBell } from "react-icons/fa";
import { MdOutlineShoppingCart } from "react-icons/md";
import SearchDropdown from "./SearchDropdown";

const Header = () => {
  // Dropdown state for avatar
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);

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
  const [showCategories, setShowCategories] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Get user data from Redux store
  const user = useSelector((state) => state.user);
  const localLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const localUser = localStorage.getItem("user");
  const localToken =
    getAccessToken();

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

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAccessToken();
      dispatch(clearUser());
      navigate("/");
    }
  };

  // Handle mentor button click
  const handleMentorClick = () => {
    navigate("/all-mentors");
  };

  return (
    <>
      {/* height ổn định theo breakpoint, sticky header, container chuẩn */}
      <header className="sticky top-0 z-40 w-full bg-white">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-8">
          {/* no-wrap row, spacing grow theo breakpoint */}
          <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 lg:gap-6 flex-nowrap">
            {/* Logo: shrink-0, hit-area đều, căn giữa */}
            <button
              type="button"
              className="shrink-0 h-10 flex items-center px-2 font-inter font-bold text-slate-700 hover:text-slate-900 text-lg md:text-2xl mr-2 md:mr-4 cursor-pointer transition-colors duration-200"
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
            {/* Categories/Mentors: hidden trên mobile, hit-area đều, căn giữa */}
            <button
              onClick={handleMentorClick}
              className="hidden md:inline-flex h-10 items-center rounded-md px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-sm md:text-base font-inter font-light leading-5 mr-2 md:mr-4 whitespace-nowrap transition-all duration-200"
            >
              {showCategories ? "Categories" : "Mentors"}
            </button>
            {/* search co giãn: flex-1 min-w-0, max-w-xl */}
            {/* search grow, trần theo breakpoint, không vỡ layout */}
            <div className="flex-1 min-w-0 mr-2 md:mr-4">
              <div className="flex items-center gap-2 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
                <SearchDropdown />
              </div>
            </div>
            {/* Tagline: shrink-0, hit-area đều, căn giữa */}
            {/* Tagline: shrink-0, căn giữa dọc, cùng chiều cao với các nút */}
            <div className="hidden lg:flex items-center shrink-0 h-10 px-2 text-slate-500 text-sm lg:text-base font-inter font-light leading-5 whitespace-nowrap">
              Mentor with MentorMe
            </div>
            {/* Action area: flex, icon đều, hit-area chuẩn */}
            {/* Action area: shrink-0, spacing grow theo breakpoint */}
            <div className="flex items-center gap-2 md:gap-4 lg:gap-5 shrink-0 ml-2">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/auth/signin");
                    }}
                    className="h-10 px-3 text-sm border border-slate-500 bg-transparent text-slate-500 font-light rounded hover:bg-slate-500 hover:text-white transition-all duration-200 flex items-center"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem("mentorMode", "false");
                      setShowCategories(false);
                      navigate("/auth/signup");
                    }}
                    className="h-10 px-3 text-sm bg-slate-700 border border-slate-500 text-white font-light rounded hover:bg-slate-600 hover:border-slate-600 transition-all duration-200 flex items-center"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
                    onClick={() => handleAPICall("demo-mentor-id", "Favorite")}
                  >
                    <FaRegHeart className="text-xl md:text-2xl text-slate-500 hover:text-red-500 transition-colors duration-200" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
                    onClick={() => handleAPICall("cart-mentor-id", "Cart")}
                  >
                    <MdOutlineShoppingCart className="text-xl md:text-2xl text-slate-500 hover:text-slate-600 transition-colors duration-200" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
                    onClick={() => handleAPICall("bell-mentor-id", "Bell")}
                  >
                    <FaRegBell className="text-xl md:text-2xl text-slate-500 hover:text-blue-500 transition-colors duration-200" />
                  </button>
                  {/* Avatar: mở dropdown khi click */}
                  <div className="relative header-avatar-dropdown">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-white text-base md:text-lg font-bold cursor-pointer select-none hover:bg-slate-600 transition-colors duration-200"
                      onClick={() => setShowAvatarDropdown((v) => !v)}
                      title="Account menu"
                    >
                      {user?.firstName?.charAt(0).toUpperCase() || "U"}
                    </button>
                    {showAvatarDropdown && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded shadow-lg z-50">
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700 text-sm"
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
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700 text-sm border-t border-slate-100"
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
        <div className="h-px w-full bg-slate-300" />
      </header>
      <Outlet />
    </>
  );
};

export default Header;
