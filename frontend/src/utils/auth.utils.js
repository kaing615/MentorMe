import { getAccessToken } from "../auth/session.js";
/**
 * Authentication utilities for production environment
 */

import axios from "axios";
import { toast } from "react-toastify";

/**
 * Validate if current user still exists in database
 * @returns {Promise<boolean>} - true if user is valid, false otherwise
 */
export const validateCurrentUser = async () => {
  try {
    const token =
      getAccessToken();

    if (!token) {
      return false;
    }

    // Call backend to validate user
    const response = await axios.get("/api/v1/user/validate", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error("User validation failed:", error);

    // If 401 or authentication error, user is invalid
    if (
      error.response?.status === 401 ||
      error.message?.includes("unauthorized") ||
      error.message?.includes("Token")
    ) {
      return false;
    }

    // For other errors, assume user is still valid (network issues, etc.)
    return true;
  }
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  // Get current user ID before clearing to remove user-specific data
  let currentUserId = null;
  try {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    currentUserId = user?.id || user?._id;
  } catch (e) {
    // Ignore parse errors
  }

  // Clear main auth data
  localStorage.removeItem("token");
  localStorage.removeItem("actkn");
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("mentorProfileTab");
  localStorage.removeItem("menteeProfileTab");
  localStorage.removeItem("selectedRole");

  // Clear user-specific course data
  if (currentUserId) {
    localStorage.removeItem(`mockPurchasedCourses_${currentUserId}`);
  }

  // Clear any legacy course data
  localStorage.removeItem("mockPurchasedCourses");

  // Clear any other app-specific cached data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes("course") ||
        key.includes("Course") ||
        key.includes("profile") ||
        key.includes("Profile") ||
        (currentUserId && key.includes(currentUserId)))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

/**
 * Handle authentication failure - clear data and redirect
 * @param {Function} navigate - React Router navigate function
 * @param {string} message - Error message to show
 */
export const handleAuthFailure = (
  navigate,
  message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!"
) => {
  console.error("Authentication failure - clearing data and redirecting");

  // Clear all auth data
  clearAuthData();

  // Show error message
  toast.error(message, {
    position: "top-right",
    autoClose: 3000,
  });

  // Redirect to login
  navigate("/auth/signin");
};

/**
 * Check if error is authentication related
 * @param {Error} error - The error to check
 * @returns {boolean} - true if it's an auth error
 */
export const isAuthError = (error) => {
  return (
    error.response?.status === 401 ||
    error.message?.includes("unauthorized") ||
    error.message?.includes("Token") ||
    error.message?.includes("Tài khoản không tồn tại")
  );
};

/**
 * Enhanced auth check for profile pages
 * @param {Function} navigate - React Router navigate function
 * @param {string} requiredRole - Required role ('mentor' or 'mentee')
 * @returns {Promise<boolean>} - true if auth is valid
 */
export const validateProfileAuth = async (navigate, requiredRole) => {
  try {
    // 1. Check localStorage first
    const token =
      getAccessToken();
    const userStr = localStorage.getItem("user");

    if (!token) {
      handleAuthFailure(navigate, "Vui lòng đăng nhập để tiếp tục.");
      return false;
    }

    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }

    if (!user || !user.role) {
      handleAuthFailure(navigate, "Thông tin đăng nhập không hợp lệ.");
      return false;
    }

    // 2. Check role
    if (user.role !== requiredRole) {
      if (user.role === "mentor" && requiredRole === "mentee") {
        navigate("/mentor/home");
        return false;
      }
      if (user.role === "mentee" && requiredRole === "mentor") {
        navigate("/home");
        return false;
      }
      // For other roles
      navigate("/auth/signin");
      return false;
    }

    // 3. Validate with backend (async check)
    const isValid = await validateCurrentUser();
    if (!isValid) {
      handleAuthFailure(
        navigate,
        "Tài khoản không còn hợp lệ. Vui lòng đăng nhập lại."
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Profile auth validation error:", error);

    if (isAuthError(error)) {
      handleAuthFailure(navigate);
      return false;
    }

    // For non-auth errors, allow user to continue
    return true;
  }
};

export default {
  validateCurrentUser,
  clearAuthData,
  handleAuthFailure,
  isAuthError,
  validateProfileAuth,
};
