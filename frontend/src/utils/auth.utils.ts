/**
 * Authentication utilities for production environment
 */

import { toast } from "react-toastify";
import { apiClient } from "../api/clients/api.client";

/**
 * Validate if current user still exists in database
 * @returns {Promise<boolean>} - true if user is valid, false otherwise
 */
export const validateCurrentUser = async () => {
  try {
    const token =
      localStorage.getItem("token") || localStorage.getItem("actkn");

    if (!token) {
      return false;
    }

    // Call backend to validate user
    const response = await apiClient.get("/profile");

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
  // Clear main auth data
  localStorage.removeItem("token");
  localStorage.removeItem("actkn");
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("mentorProfileTab");
  localStorage.removeItem("menteeProfileTab");
  localStorage.removeItem("selectedRole");

  // Clear any other app-specific cached data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes("course") ||
        key.includes("Course") ||
        key.includes("profile") ||
        key.includes("Profile"))
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
      localStorage.getItem("token") || localStorage.getItem("actkn");
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
