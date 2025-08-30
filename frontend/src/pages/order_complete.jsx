// Format ISO date to dd/MM/yyyy HH:mm
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
// Local currency formatter (VND)
function formatCurrency(amount) {
  if (typeof amount !== "number") return "₫0";
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import { useCart } from "../contexts/CartContext"; // chưa dùng -> có thể xoá
import { order } from "../data/seedData";

const OrderComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderInfo = location.state?.orderInfo;

  // Check user authentication and role
  useEffect(() => {
    const checkUserAccess = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const userData = localStorage.getItem("userData");

      if (!isLoggedIn || isLoggedIn !== "true") {
        alert("Please login to access this page");
        navigate("/auth/signin");
        return;
      }

      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === "mentor") {
            alert(
              "Mentors cannot access order pages. Only mentees can view order details."
            );
            navigate("/");
            return;
          } else if (user.role !== "mentee") {
            alert("Invalid user role. Please contact support.");
            navigate("/");
            return;
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
          alert("Invalid user data. Please login again.");
          localStorage.removeItem("userData");
          localStorage.setItem("isLoggedIn", "false");
          navigate("/auth/signin");
          return;
        }
      } else {
        alert("User data not found. Please login again.");
        localStorage.setItem("isLoggedIn", "false");
        navigate("/auth/signin");
        return;
      }
    };

    checkUserAccess();
  }, [navigate]);

  // Không cần load từ seedData, dùng trực tiếp orderInfo từ state

  const handleContinueShopping = () => {
    navigate("/courses");
  };

  // Loading state
  if (!orderInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Order Error
          </h1>
          <p className="text-gray-700 mb-6">Order info not found.</p>
          <button
            onClick={handleContinueShopping}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Complete
            </h1>
            <p className="text-gray-600 text-lg">
              You will receive a confirmation email soon!
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-gray-900">
                    {order._id || "#Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(orderInfo.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Courses Purchased:</span>
                  <span className="font-medium text-gray-900">
                    {orderInfo.selectedCourses?.length || 0} Course
                    {orderInfo.selectedCourses?.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">
                    {orderInfo?.status || "Completed"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Price Details:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">
                    {formatCurrency(orderInfo.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-green-600">
                    -{formatCurrency(orderInfo.discount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold">
                    {formatCurrency(orderInfo.tax)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6 mb-4">
              <span className="text-xl font-semibold text-gray-700">
                Total Amount:
              </span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(orderInfo.total)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleContinueShopping}
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </button>
          </div>

          {/* Info & Support */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  What happens next?
                </h4>
                <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                  <li>You'll receive a confirmation email within 5 minutes</li>
                  <li>Access your course immediately in your dashboard</li>
                  <li>Start learning at your own pace</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@mentorme.com"
                className="text-blue-600 hover:text-blue-700"
              >
                support@mentorme.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderComplete;
