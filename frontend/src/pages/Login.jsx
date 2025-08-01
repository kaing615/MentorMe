import React, { useState } from "react";
import ImageForLogin from "../assets/ImageForLogin.jpg";
import fb from "../assets/facebook.png";
import gg from "../assets/google.png";
import mcs from "../assets/microsoft.png";
import { IoArrowForward } from "react-icons/io5";
import { authApi } from "../api/modules/auth.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { setUser } from "../redux/features/user.slice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";

const Login = () => {
  const [selected, setSelected] = useState("mentee");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(showLoading());
    const timeout = setTimeout(() => {
      dispatch(hideLoading());
    }, 1200);
    return () => clearTimeout(timeout);
  }, [dispatch]);

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
    const newErrors = {};
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
        dispatch(setUser({
          ...userData,
          isLoggedIn: true,
          userType: selected // Store whether user logged in as mentee or mentor
        }));
      }
      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
      }

      // Navigate based on user role or selected type
      if (selected === "mentee") {
        navigate("/home"); // Navigate to homeScreen for mentee
      } else if (selected === "mentor") {
        navigate("/mentor-dashboard"); // Navigate to mentor page (will be updated later)
      } else {
        navigate("/"); // Default fallback
      }
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
    <div className="flex items-center">
      <div className="w-1/2 flex-col items-center">
        <h1 className="mb-4 text-5xl font-bold text-center ml-37">Log in</h1>

        <div title="Login form" className="flex flex-col ml-30">
          <div
            title="I'm a Mentor or I'm a Mentee"
            className="flex flex-row mb-4 gap-50 mx-auto relative"
          >
            <div
              title="Mentee"
              className={`text-2xl font-Inter cursor-pointer w-[180px] text-center pb-2 transition-colors duration-300 ${
                selected === "mentee" ? "text-slate-900" : "text-slate-500"
              }`}
              onClick={() => setSelected("mentee")}
            >
              I'm a mentee
            </div>
            <div
              title="Mentor"
              className={`text-2xl font-Inter cursor-pointer w-[180px] text-center pb-2 transition-colors duration-300 ${
                selected === "mentor" ? "text-slate-900" : "text-slate-500"
              }`}
              onClick={() => setSelected("mentor")}
            >
              I'm a mentor
            </div>

            {/* Sliding underline */}
            <div
              className="absolute bottom-0 h-[2px] bg-slate-800 transition-all duration-300 ease-in-out"
              style={{
                width: "180px",
                left: selected === "mentee" ? "0px" : "380px",
              }}
            />
          </div>

          <div className="flex flex-col items-start w-[700px]">
            <label className="block mb-1 text-lg font-medium text-left">
              Email <span className="text-red-500">*</span>
            </label>
            <div alt="Email" className="mb-4 flex flex-col">
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="Email ID"
                className={`p-2 border rounded-[9px] h-[52px] w-[700px] focus:outline-none ${
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

          <div className="flex flex-col items-start w-[700px]">
            <label className="block mb-1 text-lg font-medium text-left">
              Password <span className="text-red-500">*</span>
            </label>
            <div alt="Password" className="mb-4 flex flex-col">
              <input
                type="password"
                name="password"
                value={formData.password}
                placeholder="Enter password"
                className={`p-2 border rounded-[9px] h-[52px] w-[700px] focus:outline-none ${
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

          <div alt="Sign In Button" className="mb-1 items">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-slate-950 text-white hover:bg-slate-800"
              }`}
            >
              <span className="font-bold">
                {isLoading ? "Đang đăng nhập..." : "Sign In"}
              </span>
              {!isLoading && <IoArrowForward className="text-lg" />}
            </button>
          </div>

          {/* Container with fixed space for social media */}
          <div className="relative h-32 w-full">
            <div
              className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${
                selected === "mentee"
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform -translate-y-4 pointer-events-none"
              }`}
            >
              <div className="flex items-center w-[700px]">
                <hr className="flex-1 border-t border-slate-400" />
                <span className="mx-4 text-lg font-medium text-slate-400 whitespace-nowrap">
                  Sign In with
                </span>
                <hr className="flex-1 border-t border-slate-400" />
              </div>

              <div
                alt="Social Media Sign In"
                className="flex flex-row mb-4 gap-12.5 mt-3"
              >
                <button
                  onClick={() => window.open("https://facebook.com")}
                  className="flex flex-row items-center justify-center w-[200px] px-22 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                >
                  <img src={fb} alt="Facebook" className="h-6 mr-2" />
                  <span className="text-lg font-medium text-blue-600">
                    Facebook
                  </span>
                </button>

                <button
                  onClick={() => window.open("https://google.com")}
                  className="flex flex-row items-center justify-center w-[200px] px-22 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-red-50 transition-colors duration-200"
                >
                  <img src={gg} alt="Google" className="h-6 mr-2" />
                  <span className="text-lg font-medium text-red-500">
                    Google
                  </span>
                </button>

                <button
                  onClick={() => window.open("https://microsoft.com")}
                  className="flex flex-row items-center justify-center w-[200px] px-22 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                >
                  <img src={mcs} alt="Microsoft" className="h-6 mr-2" />
                  <span className="text-lg font-medium text-black">
                    Microsoft
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-1/2 flex justify-end" alt="Log In Image">
        <img
          src={ImageForLogin}
          alt="Login"
          className="object-cover w-150 h-auto"
        />
      </div>
    </div>
  );
};

export default Login;