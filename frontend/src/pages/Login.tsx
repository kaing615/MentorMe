import React, { useState } from "react";
import ImageForLogin from "../assets/ImageForLogIn.jpg";
import authApi from "../api/modules/auth.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { setUser } from "../redux/features/user.slice";
import { initializeAuth } from "../redux/features/auth.slice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { getRoleHomePath } from "../routes/path";

const Login = () => {
  const [formData, setFormData] = useState<any>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const [isLoading, setIsLoading] = useState<any>(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("actkn") || localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      
      if (token && user && isLoggedIn === "true") {
        try {
          const userData = JSON.parse(user);
          
          if (token.split('.').length === 3) {
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
  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return "Invalid email format";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    return null;
  };

  const validateForm = () => {
    const newErrors: any = {};
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    return newErrors;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error if field was touched
    if (touched[name]) {
      let fieldError = null;
      if (name === "email") fieldError = validateEmail(value);
      if (name === "password") fieldError = validatePassword(value);

      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    let fieldError = null;
    if (name === "email") fieldError = validateEmail(value);
    if (name === "password") fieldError = validatePassword(value);

    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  // Handle form submission
  const handleSubmit = async () => {
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
      const response = await authApi.signin(formData);

      toast.success("Đăng nhập thành công!");

      // Store user data in localStorage and Redux store
      if (response.data?.user) {
        const userData = response.data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isLoggedIn", "true"); // Set login status in localStorage for header
        
        // Dispatch user data to Redux store with isLoggedIn flag
        dispatch(setUser({ ...userData, isLoggedIn: true }));
      }
      if (response.data?.token) {
        localStorage.setItem("actkn", response.data.token);
      }

      dispatch(initializeAuth());
      navigate(getRoleHomePath(response.data?.user?.role));
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error response:", error.response);

      let errorMessage = "Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại!";

      if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Check if error is about unverified email
      if (
        errorMessage.includes("Email hoặc mật khẩu không đúng") ||
        error.response?.status === 401
      ) {
        toast.error(
          "Email hoặc mật khẩu không đúng. Nếu bạn chưa xác thực email, vui lòng kiểm tra hộp thư!"
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 items-stretch bg-[var(--ui-surface)] lg:grid-cols-2">
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mb-8 w-full max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-[var(--ui-text)] sm:text-5xl">Welcome back</h1>
          <p className="mt-3 text-[var(--ui-text-muted)]">Continue learning with the mentors who understand your goals.</p>
        </div>

        <div title="Login form" className="flex w-full max-w-lg flex-col">
          <div className="flex flex-col items-start w-full">
            <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-left">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="mb-5 flex w-full flex-col">
              <input
                id="login-email"
                type="email"
                name="email"
                value={formData.email}
                placeholder="Email ID"
                className={`h-[52px] w-full rounded-xl border bg-[var(--ui-surface)] px-4 focus:outline-none ${
                  errors.email && touched.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.email && touched.email && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.email}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start w-full">
            <label htmlFor="login-password" className="mb-2 block text-sm font-bold text-left">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="mb-5 flex w-full flex-col">
              <input
                id="login-password"
                type="password"
                name="password"
                value={formData.password}
                placeholder="Enter password"
                className={`h-[52px] w-full rounded-xl border bg-[var(--ui-surface)] px-4 focus:outline-none ${
                  errors.password && touched.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.password && touched.password && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.password}
                </span>
              )}
            </div>
          </div>

          <div className="mb-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`mb-3.5 flex min-h-12 w-full items-center justify-center rounded-xl border-0 px-6 py-3 text-left font-bold transition-colors ${
                isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "cursor-pointer bg-[var(--ui-accent)] text-white hover:bg-[var(--ui-accent-strong)]"
              }`}
            >
              <span className="font-bold">
                {isLoading ? "Đang đăng nhập..." : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-full min-h-[calc(100dvh-4rem)] justify-end">
        <img
          src={ImageForLogin}
          alt="A learner reviewing notes in a workshop"
          className="object-cover w-full h-full max-h-[calc(100dvh-4rem)]"
        />
      </div>
    </div>
  );
};

export default Login;
