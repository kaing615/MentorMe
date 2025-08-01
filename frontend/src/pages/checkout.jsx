import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../data/mockCartData";
import { useCart } from "../contexts/CartContext";

const Checkout = () => {
  const navigate = useNavigate();
  const {
    selectedCourses,
    subtotal,
    discount,
    tax,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("Credit/Debit Card");
  const [couponCode, setCouponCode] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponMessageType, setCouponMessageType] = useState(""); // "success" or "error"
  const [showMomoQR, setShowMomoQR] = useState(false);
  const [showBankQR, setShowBankQR] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    country: "",
    state: "",
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProceedToCheckout = () => {
    // TODO: Replace with actual API call
    const mockOrderId = Date.now().toString();
    console.log("Processing checkout...", {
      formData,
      selectedCourses,
      paymentMethod,
      total,
      orderId: mockOrderId,
    });

    // Navigate to order complete page with order ID
    navigate(`/mentee/order_complete?orderId=${mockOrderId}`);
  };

  const applyCouponCode = () => {
    if (!showCouponInput) {
      setShowCouponInput(true);
      setCouponMessage("");
    } else if (couponCode.trim()) {
      // Apply coupon using CartContext
      const result = applyCoupon(couponCode.trim());
      setCouponMessage(result.message);
      setCouponMessageType(result.success ? "success" : "error");

      if (result.success) {
        setShowCouponInput(false);
        setCouponCode("");
      }
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMessage("");
    setCouponCode("");
  };

  const handleDateSelect = (month, year) => {
    const formattedDate = `${month.toString().padStart(2, "0")}/${year
      .toString()
      .slice(-2)}`;
    setFormData((prev) => ({
      ...prev,
      expiryDate: formattedDate,
    }));
    setShowDatePicker(false);
  };

  const generateMonthYearOptions = () => {
    const months = [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
    ];

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 50; i++) {
      years.push(currentYear + i);
    }

    return { months, years };
  };

  return (
    <div className="min-h-screen bg-white-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Checkout Page
            </h1>

            {/* Billing Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    placeholder="Enter Country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Union Territory
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder="Enter State"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Method
              </h3>

              {/* Credit/Debit Card Option */}
              <div className="mb-6">
                <label className="flex items-center gap-3 mb-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Credit/Debit Card"
                    checked={paymentMethod === "Credit/Debit Card"}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setShowMomoQR(false);
                      setShowBankQR(false);
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900 font-medium">
                    Credit/Debit Card
                  </span>
                  <div className="flex gap-2 ml-auto">
                    {/* Visa Logo */}
                    <div className="h-6 w-12 bg-white border border-gray-200 rounded flex items-center justify-center px-1">
                      <span className="text-blue-600 text-xs font-bold tracking-wider">
                        VISA
                      </span>
                    </div>
                    {/* Mastercard Logo */}
                    <div className="h-6 w-12 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full -ml-1"></div>
                      </div>
                    </div>
                  </div>
                </label>

                {paymentMethod === "Credit/Debit Card" && (
                  <div className="ml-7 space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Name of Card
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        placeholder="Name of card"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="Card Number"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm text-gray-600 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onClick={() => setShowDatePicker(true)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />

                        {/* Date Picker Dropdown */}
                        {showDatePicker && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 w-72">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium text-gray-900">
                                Select Expiry Date
                              </h4>
                              <button
                                onClick={() => setShowDatePicker(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {/* Month Selection */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Month
                                </label>
                                <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                                  {generateMonthYearOptions().months.map(
                                    (month) => (
                                      <button
                                        key={month.value}
                                        onClick={() => {
                                          // Set to current year by default when selecting only month
                                          const currentYear =
                                            new Date().getFullYear();
                                          handleDateSelect(
                                            month.value,
                                            currentYear
                                          );
                                        }}
                                        className="text-sm p-2 text-left border-b border-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        {month.label}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Year Selection */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Year
                                </label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                                  {generateMonthYearOptions().years.map(
                                    (year) => (
                                      <button
                                        key={year}
                                        onClick={() => {
                                          // Set to January by default when selecting only year
                                          handleDateSelect(1, year);
                                        }}
                                        className="block w-full text-sm p-2 text-left border-b border-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        {year}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 text-center">
                              <p className="text-xs text-gray-500">
                                Select a month and year for your card expiry
                                date
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          CVC/CVV
                        </label>
                        <input
                          type="text"
                          name="cvc"
                          placeholder="CVC"
                          value={formData.cvc}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Momo Option */}
              <div className="mb-6">
                <label className="flex items-center gap-3 mb-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Momo"
                    checked={paymentMethod === "Momo"}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setShowMomoQR(true);
                      setShowBankQR(false);
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900 font-medium">Momo</span>
                  <div className="ml-auto">
                    <div className="bg-pink-500 text-white px-3 py-1 rounded text-xs font-bold">
                      MoMo
                    </div>
                  </div>
                </label>

                {paymentMethod === "Momo" && showMomoQR && (
                  <div className="ml-7 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Scan QR code to pay
                      </h4>
                      <div className="bg-gray-100 p-4 rounded-lg inline-block">
                        {/* QR Code placeholder - replace with actual QR code */}
                        <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📱</div>
                            <p className="text-sm text-gray-600">
                              MoMo QR Code
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Admin: 0123456789
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-3">
                        Scan QR code with MoMo app to pay $290.00
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Transfer Option */}
              <div>
                <label className="flex items-center gap-3 mb-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Bank Transfer"
                    checked={paymentMethod === "Bank Transfer"}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setShowBankQR(true);
                      setShowMomoQR(false);
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900 font-medium">
                    Bank Transfer
                  </span>
                  <div className="ml-auto">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold">
                      QR Pay
                    </div>
                  </div>
                </label>

                {paymentMethod === "Bank Transfer" && showBankQR && (
                  <div className="ml-7 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Scan QR code for bank transfer
                      </h4>
                      <div className="bg-gray-100 p-4 rounded-lg inline-block">
                        {/* Bank QR Code placeholder - replace with actual QR code */}
                        <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🏦</div>
                            <p className="text-sm text-gray-600">
                              Bank QR Code
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Account: 1234567890
                            </p>
                            <p className="text-xs text-gray-500">Vietcombank</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-left mt-4 bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Bank Transfer Information:
                        </p>
                        <p className="text-sm text-gray-600">
                          Bank: Vietcombank
                        </p>
                        <p className="text-sm text-gray-600">
                          Account Number: 1234567890
                        </p>
                        <p className="text-sm text-gray-600">
                          Account Holder: MENTORME ADMIN
                        </p>
                        <p className="text-sm text-gray-600">Amount: $290.00</p>
                        <p className="text-sm text-gray-600">
                          Reference: MENTORME CHECKOUT
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Order Details
            </h1>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-8">
              {/* Course Summary */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">
                  {selectedCourses.length} Course
                  {selectedCourses.length > 1 ? "s" : ""} Selected
                </h3>
                <p className="text-xs text-gray-500">
                  Total:{" "}
                  {selectedCourses.reduce(
                    (sum, course) => sum + course.lectures,
                    0
                  )}{" "}
                  Lectures •{" "}
                  {selectedCourses.reduce(
                    (sum, course) => sum + course.totalHours,
                    0
                  )}{" "}
                  Total Hours
                </p>
              </div>

              {/* Course Items */}
              <div className="mb-6 space-y-4 max-h-64 overflow-y-auto">
                {selectedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={course.image}
                        alt={course.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block mb-1">
                        {course.category}
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1 text-sm truncate">
                        {course.name}
                      </h4>
                      <p className="text-xs text-gray-600 mb-1">
                        {course.lectures} Lectures • {course.totalHours} Hours
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(course.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="mb-6">
                {/* Show applied coupon if exists */}
                {appliedCoupon ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Coupon "{appliedCoupon.code}" appllied!
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={applyCouponCode}
                    className="w-full flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">
                      {showCouponInput ? "APPLY COUPON" : "APPLY COUPON CODE"}
                    </span>
                  </button>
                )}

                {/* Coupon Input Field */}
                {showCouponInput && !appliedCoupon && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            applyCouponCode();
                          }
                        }}
                      />
                      <button
                        onClick={applyCouponCode}
                        disabled={!couponCode.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Coupon message */}
                    {couponMessage && (
                      <div
                        className={`text-sm ${
                          couponMessageType === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {couponMessage}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowCouponInput(false);
                        setCouponMessage("");
                        setCouponCode("");
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
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
                  <span className="text-gray-600">Base Discount</span>
                  <span className="font-semibold text-green-600">
                    -{formatCurrency(10.0)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Coupon ({appliedCoupon.code})
                    </span>
                    <span className="font-semibold text-green-600">
                      -{formatCurrency(appliedCoupon.discount)}
                    </span>
                  </div>
                )}
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

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
