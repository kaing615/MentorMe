import React, { useState, useEffect } from "react";
import ImageForSignUp from "../assets/ImageForSignUp.jpg";
import fb from "../assets/facebook.png";
import gg from "../assets/google.png";
import mcs from "../assets/microsoft.png";
import { authApi } from "../api/modules/auth.api";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { toast } from "react-toastify";
import { showLoading, hideLoading } from "../redux/features/loading.slice";

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    dispatch(showLoading());
    const timeout = setTimeout(() => {
      dispatch(hideLoading());
    }, 1200);
    return () => clearTimeout(timeout);
  }, [dispatch]);

  return (
    <div className="flex items-center">
      <div className="w-1/2" alt="Sign Up Image">
        <img
          src={ImageForSignUp}
          alt="Sign Up"
          className="object-cover w-auto h-250"
        />
      </div>

      <div className="w-1/2">
        <h1 className="mb-4 text-5xl font-medium text-center">
          Create Your Account
        </h1>
        <div alt="Sign Up Form" className="flex flex-col">
          <label className="block mb-1 text-lg font-medium text-left">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div alt="Full Name" className="flex flex-row mb-4 gap-6">
            <div className="flex flex-col">
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                placeholder="First Name"
                onChange={(e) => handleChange("firstName", e.target.value)}
                onBlur={(e) => handleBlur("firstName", e.target.value)}
                className={`p-2 border rounded-[9px] h-[52px] w-[330px] focus:outline-none ${
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
                className={`p-2 border rounded-[9px] h-[52px] w-[345px] focus:outline-none ${
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

          <label className="block mb-1 text-lg font-medium text-left">
            Username <span className="text-red-500">*</span>
          </label>
          <div alt="Username" className="mb-4 flex flex-col">
            <input
              name="userName"
              type="text"
              value={formData.userName}
              placeholder="Username"
              onChange={(e) => handleChange("userName", e.target.value)}
              onBlur={(e) => handleBlur("userName", e.target.value)}
              className={`p-2 border rounded-[9px] h-[52px] w-[699px] focus:outline-none ${
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

          <label className="block mb-1 text-lg font-medium text-left">
            Email <span className="text-red-500">*</span>
          </label>
          <div alt="Email" className="mb-4 flex flex-col">
            <input
              name="email"
              type="email"
              value={formData.email}
              placeholder="Email ID"
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              className={`p-2 border rounded-[9px] h-[52px] w-[699px] focus:outline-none ${
                errors.email && touched.email
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.email && touched.email && (
              <span className="text-red-500 text-sm mt-1">{errors.email}</span>
            )}
          </div>

          <div className="flex flex-row mb-1 gap-69.5">
            <label className="text-lg font-medium text-left">
              Password <span className="text-red-500">*</span>
            </label>
            <label className="text-lg font-medium text-left">
              Confirm Password <span className="text-red-500">*</span>
            </label>
          </div>
          <div alt="Password" className="flex flex-row mb-4 gap-6">
            <div className="flex flex-col">
              <input
                name="password"
                type="password"
                value={formData.password}
                placeholder="Password"
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={(e) => handleBlur("password", e.target.value)}
                className={`p-2 border rounded-[9px] h-[52px] w-[330px] focus:outline-none ${
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
                className={`p-2 border rounded-[9px] h-[52px] w-[345px] focus:outline-none ${
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

          <div
            alt="Create Account Button - Apply to be a Mentor"
            className="flex flex-row mb-4 gap-75"
          >
            <button
              onClick={onFinish}
              disabled={isLoading}
              className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-slate-950 text-white hover:bg-slate-800"
              }`}
            >
              <span className="font-bold">
                {isLoading ? "Đang tạo tài khoản..." : "Create Account"}
              </span>
              {!isLoading && <IoArrowForward className="text-lg" />}
            </button>

            <button
              onClick={() => {
                localStorage.setItem("mentorMode", "true");
                navigate("/auth/apply-as-men");
              }}
              className="flex items-center text-left py-3 px-6 mb-3.5 gap-1 rounded-lg border-0 cursor-pointer"
            >
              <span className="text-black text-sm font-bold">
                Apply to be a Mentor
              </span>
              <IoArrowForward className="text-black text-lg" />
            </button>
          </div>

          <div alt="Sign Up with" className="flex flex-row">
            <hr className="border-t border-slate-400 w-70 my-4" />
            <span className="mx-4 text-lg font-medium text-slate-400">
              Sign Up with
            </span>
            <hr className="border-t border-slate-400 w-70 my-4" />
          </div>

          <div alt="Social Media Sign Up" className="flex flex-row mb-4 gap-4">
            <button
              alt="Facebook Sign Up"
              onClick={() => window.open("https://facebook.com")}
              className="flex flex-row items-center px-15 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors duration-200"
            >
              <img src={fb} alt="Facebook" className="h-6 mr-2" />
              <span className="text-lg font-medium text-blue-600">
                Facebook
              </span>
            </button>

            <button
              alt="Google Sign Up"
              onClick={() => window.open("https://google.com")}
              className="flex flex-row items-center px-15 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-red-50 transition-colors duration-200"
            >
              <img src={gg} alt="Google" className="w-6 h-6 mr-2" />
              <span className="text-lg font-medium text-red-500">Google</span>
            </button>

            <button
              alt="Microsoft Sign Up"
              onClick={() => window.open("https://microsoft.com")}
              className="flex flex-row items-center px-15 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors duration-200"
            >
              <img src={mcs} alt="Microsoft" className="w-6 h-6 mr-2" />
              <span className="text-md font-medium text-black">Microsoft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
