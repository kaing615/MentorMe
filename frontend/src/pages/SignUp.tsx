import React, { useState, useEffect } from "react";
import ImageForSignUp from "../assets/ImageForSignUp.jpg";
import authApi from "../api/modules/auth.api";
import { useNavigate } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { getRoleHomePath } from "../routes/path";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const [isLoading, setIsLoading] = useState<any>(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token =
        localStorage.getItem("actkn") || localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      if (token && user && isLoggedIn === "true") {
        try {
          const userData = JSON.parse(user);

          if (token.split(".").length === 3) {
            navigate(getRoleHomePath(userData.role), { replace: true });

            toast.info("You are already logged in!");
          } else {
            // Invalid token format, clear storage
            throw new Error("Invalid token format");
          }
        } catch (error) {
          console.error("Error validating auth data:", error);
          // Clear invalid data
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("actkn");
          localStorage.removeItem("isLoggedIn");
        }
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
        return !value.trim() ? "First name is required" : null;
      case "lastName":
        return !value.trim() ? "Last name is required" : null;
      case "userName":
        return !value.trim() ? "Username is required" : null;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
          return "Invalid email format";
        return null;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
      case "confirmPassword":
        if (!value) return "Confirm password is required";
        if (value !== formData.password) return "Passwords do not match";
        return null;
      default:
        return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    return newErrors;
  };

  // Handle input changes
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error if field was touched
    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const onFinish = async () => {
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      const touchedFields = {};
      Object.keys(formErrors).forEach((key) => (touchedFields[key] = true));
      setTouched((prev) => ({ ...prev, ...touchedFields }));
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending signup data:", formData);
      const response = await authApi.signup(formData);
      toast.success(response?.data?.message || "Đăng ký thành công!");
      navigate(
        `/auth/verify-email?email=${encodeURIComponent(formData.email)}`
      );
    } catch (error) {
      console.error("Error signing up:", error);
      console.error("Error response:", error.response);
      if (error.response?.data?.data?.message) {
        toast.error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 items-stretch bg-[var(--ui-surface)] lg:grid-cols-2">
      <div className="hidden lg:block">
        <img
          src={ImageForSignUp}
          alt="A student preparing for a focused learning session"
          className="sticky top-16 h-[calc(100dvh-4rem)] w-full object-cover"
        />
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-8 lg:py-14">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-[var(--ui-text)] sm:text-5xl">Create your account</h1>
        <p className="mb-8 mt-3 text-[var(--ui-text-muted)]">Start with a learner account. You can apply to mentor at any time.</p>
        <div className="flex flex-col">
          <label className="mb-2 block text-sm font-bold text-left">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 mb-4 gap-4">
            <div className="flex flex-col">
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                placeholder="First Name"
                onChange={(e) => handleChange("firstName", e.target.value)}
                onBlur={(e) => handleBlur("firstName", e.target.value)}
                aria-label="First name"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.firstName && touched.firstName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.firstName && touched.firstName && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.firstName}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                placeholder="Last Name"
                onChange={(e) => handleChange("lastName", e.target.value)}
                onBlur={(e) => handleBlur("lastName", e.target.value)}
                aria-label="Last name"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.lastName && touched.lastName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.lastName && touched.lastName && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.lastName}
                </span>
              )}
            </div>
          </div>

          <label className="mb-2 block text-sm font-bold text-left">
            Username <span className="text-red-500">*</span>
          </label>
          <div className="mb-4 flex flex-col">
            <input
              name="userName"
              type="text"
              value={formData.userName}
              placeholder="Username"
              onChange={(e) => handleChange("userName", e.target.value)}
              onBlur={(e) => handleBlur("userName", e.target.value)}
              aria-label="Username"
              className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                errors.userName && touched.userName
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.userName && touched.userName && (
              <span className="text-red-500 text-sm mt-1">
                {errors.userName}
              </span>
            )}
          </div>

          <label className="mb-2 block text-sm font-bold text-left">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="mb-4 flex flex-col">
            <input
              name="email"
              type="email"
              value={formData.email}
              placeholder="Email ID"
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              aria-label="Email"
              className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                errors.email && touched.email
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.email && touched.email && (
              <span className="text-red-500 text-sm mt-1">{errors.email}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 mb-1 gap-2 sm:gap-6">
            <label className="text-sm font-bold text-left">
              Password <span className="text-red-500">*</span>
            </label>
            <label className="text-sm font-bold text-left">
              Confirm Password <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 mb-4 gap-4">
            <div className="flex flex-col">
              <input
                name="password"
                type="password"
                value={formData.password}
                placeholder="Password"
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={(e) => handleBlur("password", e.target.value)}
                aria-label="Password"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.password && touched.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.password && touched.password && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.password}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                placeholder="Confirm Password"
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                aria-label="Confirm password"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.confirmPassword && touched.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onFinish}
              disabled={isLoading}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-0 px-6 py-3 text-left font-bold transition-colors ${
                isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "cursor-pointer bg-[var(--ui-accent)] text-white hover:bg-[var(--ui-accent-strong)]"
              }`}
            >
              <span className="font-bold">
                {isLoading ? "Đang tạo tài khoản..." : "Create Account"}
              </span>
              {!isLoading && <IconArrowRight aria-hidden="true" size={19} stroke={1.8} />}
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem("mentorMode", "true");
                navigate("/auth/apply-as-men");
              }}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--ui-border)] px-6 py-3 text-left font-bold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-surface-muted)] sm:ml-auto"
            >
              <span>Apply as a mentor</span>
              <IconArrowRight aria-hidden="true" size={19} stroke={1.8} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
