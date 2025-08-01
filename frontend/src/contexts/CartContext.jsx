import React, { createContext, useContext, useState, useEffect } from "react";
import { mockCartCourses } from "../data/mockCartData";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize with mock data - auto select all courses for demo
  const [courses, setCourses] = useState(
    mockCartCourses.slice(0, 6).map((course) => ({
      ...course,
      selected: true, // Auto select all courses for demo
    }))
  );

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Coupon data
  const coupons = {
    140605: {
      code: "140605",
      discount: 50.0, // $50 discount
      type: "fixed", // fixed amount or percentage
      description: "Special discount coupon",
    },
  };

  // Get selected courses (for checkout)
  const selectedCourses = courses.filter((course) => course.selected);

  // Calculate totals based on selected courses
  const subtotal = selectedCourses.reduce(
    (sum, course) => sum + course.price,
    0
  );

  // Calculate discount (base discount + coupon discount)
  const baseDiscount = 10.0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalDiscount = baseDiscount + couponDiscount;

  const tax = (subtotal - totalDiscount) * 0.08;
  const total = subtotal - totalDiscount + tax;

  // Coupon functions
  const applyCoupon = (couponCode) => {
    const coupon = coupons[couponCode.toUpperCase()];
    if (coupon) {
      setAppliedCoupon(coupon);
      return { success: true, message: "Coupon applied successfully!" };
    }
    return { success: false, message: "Invalid coupon code" };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Cart actions
  const toggleCourseSelection = (courseId) => {
    setCourses(
      courses.map((course) =>
        course.id === courseId
          ? { ...course, selected: !course.selected }
          : course
      )
    );
  };

  const selectAllCourses = (selectAll) => {
    setCourses(
      courses.map((course) => ({
        ...course,
        selected: selectAll,
      }))
    );
  };

  const removeCourse = (courseId) => {
    setCourses(courses.filter((course) => course.id !== courseId));
  };

  const value = {
    courses,
    selectedCourses,
    subtotal,
    discount: totalDiscount,
    tax,
    total,
    appliedCoupon,
    toggleCourseSelection,
    selectAllCourses,
    removeCourse,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
