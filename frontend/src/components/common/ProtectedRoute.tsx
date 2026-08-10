import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { hasUserRole, type UserRole } from "../../utils/user-role";

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: UserRole }) => {
  const { isAuthenticated, status, user } = useSelector((state: any) => state.auth);
  let currentUser = user;
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null") || user;
  } catch {
    currentUser = user;
  }

  // Show notification when user is not authenticated
  useEffect(() => {
    if (status !== "loading" && !isAuthenticated) {
      // Check if toast with this ID already exists
      if (!toast.isActive("auth-required")) {
        toast.warn("You have to sign in first", {
          position: "top-right",
          autoClose: 3000, // 3 giây
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: "auth-required", // Unique ID
          pauseOnFocusLoss: true,
        });
      }
    }
  }, [isAuthenticated, status]);

  // Show loading while checking auth status
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (requiredRole && !hasUserRole(currentUser, requiredRole)) {
    return <Navigate to={currentUser?.role === "mentor" ? "/mentor/home" : "/home"} replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
