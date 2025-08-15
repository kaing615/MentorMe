import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { cart as mockCart, menteeUser, order } from "../data/seedData";

// Local currency formatter (VND)
function formatCurrency(amount) {
  if (typeof amount !== "number") return "₫0";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  // Hàm điều hướng sang trang checkout
  const handleProceedToCheckout = () => {
    navigate("/checkout", { state: { selectedCourses } });
  };
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  // const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  // Check user authentication and role, then fetch cart from backend or mock
  useEffect(() => {
    // Ưu tiên lấy userId từ localStorage, nếu không có thì dùng mock menteeUser
    let userId = null;
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user._id;
      } catch {}
    }
    if (!userId) userId = menteeUser._id;

    // Nếu có backend thì fetch, nếu không thì dùng mockCart
    // (Ở đây chỉ test mock, có thể mở lại fetch backend nếu cần)
    if (mockCart.user === userId) {
      const mappedCourses = mockCart.items.map((item) => ({
        ...item.courseId,
        id: item.courseId._id,
        selected: true,
        quantity: item.quantity,
      }));
      setCourses(mappedCourses);
      setSelectedCourses(mappedCourses);
      setSubtotal(mockCart.subtotalAmount || 0);
      setDiscount(mockCart.discountAmount || 0);
      setTax(mockCart.taxAmount || 0);
      setTotal(mockCart.totalAmount || 0);
    } else {
      setCourses([]);
      setSelectedCourses([]);
      setSubtotal(0);
      setDiscount(0);
      setTax(0);
      setTotal(0);
    }
  }, []);

  // Handle select all toggle
  const handleSelectAll = async () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    // Select/deselect all courses in UI
    setCourses((prev) => prev.map((c) => ({ ...c, selected: newSelectAll })));
    setSelectedCourses(newSelectAll ? [...courses] : []);
    // Optionally, update backend if needed
  };

  // Handle individual course selection
  const handleCourseSelect = (courseId) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, selected: !c.selected } : c))
    );
    setSelectedCourses((prev) => {
      const isSelected = prev.some((c) => c.id === courseId);
      if (isSelected) {
        return prev.filter((c) => c.id !== courseId);
      } else {
        const course = courses.find((c) => c.id === courseId);
        return course ? [...prev, { ...course, selected: true }] : prev;
      }
    });
  };

  // Update select all state when courses change
  useEffect(() => {
    const allSelected =
      courses.length > 0 && courses.every((course) => course.selected);
    setSelectAll(allSelected);
    setSelectedCourses(courses.filter((c) => c.selected));
  }, [courses]);

  // Recalculate subtotal, discount, tax, total when selectedCourses change
  useEffect(() => {
    const newSubtotal = selectedCourses.reduce(
      (sum, c) => sum + (c.price || 0),
      0
    );
    const newDiscount = 0;
    const newTax = 0;
    const newTotal = newSubtotal - newDiscount + newTax;
    setSubtotal(newSubtotal);
    setDiscount(newDiscount);
    setTax(newTax);
    setTotal(newTotal);
  }, [selectedCourses]);

  // Handle remove course
  const handleRemoveCourse = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/cart/remove/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (error) {
      alert("Failed to remove course from cart.");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shopping Cart */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Shopping Cart
              </h1>
              {/* Course count and select all */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600">
                  {courses.length} Course{courses.length > 1 ? "s" : ""} in cart
                  {selectedCourses.length > 0 && (
                    <span className="text-blue-600 ml-2">
                      ({selectedCourses.length} selected)
                    </span>
                  )}
                </p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </label>
              </div>
            </div>

            {/* Course List */}
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-2">
                      <input
                        type="checkbox"
                        checked={course.selected}
                        onChange={() => handleCourseSelect(course.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>

                    {/* Course Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={course.image}
                        alt={course.name}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                    </div>

                    {/* Course Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {course.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            By {course.instructor}
                          </p>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(course.rating)}
                            <span className="text-sm font-medium text-gray-900">
                              {course.rating}
                            </span>
                            <span className="text-sm text-gray-600">
                              ({course.totalRating} ratings)
                            </span>
                          </div>

                          {/* Course Info */}
                          <p className="text-sm text-gray-600 mb-3">
                            {course.totalHours} Total Hours • {course.lectures}{" "}
                            Lectures • {course.level}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleSaveForLater(course.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Save for later
                            </button>
                            <button
                              onClick={() => handleRemoveCourse(course.id)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(course.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Order Details */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Details
              </h2>

              {/* Course Summary */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">
                  {selectedCourses.length} Course
                  {selectedCourses.length > 1 ? "s" : ""} selected
                </h3>
                <p className="text-xs text-gray-500">
                  Total lectures:{" "}
                  {selectedCourses.reduce(
                    (sum, course) => sum + (course.lectures || 0),
                    0
                  )}{" "}
                  • Total hours:{" "}
                  {selectedCourses.reduce(
                    (sum, course) => sum + (course.totalHours || 0),
                    0
                  )}
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-green-600">
                    -{formatCurrency(discount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                disabled={selectedCourses.length === 0}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  selectedCourses.length > 0
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Proceed to Checkout
              </button>

              {selectedCourses.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Select items to proceed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
