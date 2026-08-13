import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { hasUserRole, type UserRole } from "../../utils/user-role";
import { getRoleHomePath } from "../../routes/path";

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--ui-page)] px-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[var(--ui-border)] border-t-[var(--ui-accent-fill)]" aria-hidden="true" />
          <p className="font-medium text-[var(--ui-text-muted)]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (requiredRole && !hasUserRole(currentUser, requiredRole)) {
    return <Navigate to={getRoleHomePath(currentUser?.role)} replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
