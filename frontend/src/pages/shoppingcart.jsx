import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../data/mockCartData";
import { useCart } from "../contexts/CartContext";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const {
    courses,
    selectedCourses,
    subtotal,
    discount,
    tax,
    total,
    toggleCourseSelection,
    selectAllCourses,
    removeCourse,
  } = useCart();

  const [currentTab, setCurrentTab] = useState("Shopping Cart");
  const [selectAll, setSelectAll] = useState(false);

  // Handle select all toggle
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    selectAllCourses(newSelectAll);
  };

  // Handle individual course selection
  const handleCourseSelect = (courseId) => {
    toggleCourseSelection(courseId);
  };

  // Update select all state when courses change
  useEffect(() => {
    const allSelected =
      courses.length > 0 && courses.every((course) => course.selected);
    setSelectAll(allSelected);
  }, [courses]);

  // Handle remove course
  const handleRemoveCourse = (courseId) => {
    removeCourse(courseId);
  };

  // Handle save for later
  const handleSaveForLater = (courseId) => {
    // Implementation for save for later functionality
    console.log("Save for later:", courseId);
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    if (selectedCourses.length > 0) {
      navigate("/mentee/checkout");
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
                  {courses.length} Course{courses.length > 1 ? "s" : ""} in Cart
                </h3>
                {selectedCourses.length > 0 && (
                  <p className="text-sm text-blue-600 mb-2">
                    {selectedCourses.length} item
                    {selectedCourses.length > 1 ? "s" : ""} selected
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Total lectures:{" "}
                  {courses.reduce((sum, course) => sum + course.lectures, 0)} •
                  Total hours:{" "}
                  {courses.reduce((sum, course) => sum + course.totalHours, 0)}
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
