import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { toast } from "react-toastify";
import checkoutApi from "../api/modules/checkout.api";
import orderApi from "../api/modules/order.api";
import vnpayLogo from "../assets/Icon VNPAY.png";
import { resolvePaymentProvider } from "../utils/payment-flow";
import { hasUserRole } from "../utils/user-role";
import { formatVnd as formatCurrency } from "../utils/currency";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // --- AUTH CHECK (chỉ mentee được phép) ---
  useEffect(() => {
    const token =
      localStorage.getItem("actkn") || localStorage.getItem("token");
    const userStr =
      localStorage.getItem("user") || localStorage.getItem("user");
    console.log("Token:", token);
    let user = null;
    if (!token) {
      navigate("/auth/signin");
      return;
    }
    // Check user object
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (!user || !user.role) {
      navigate("/auth/signin");
      return;
    }
    // Check role - chỉ mentee được phép vào checkout
    if (hasUserRole(user, "mentee")) {
      return;
    }
    // Nếu không phải mentee, redirect về home
    if (user.role === "mentor") {
      navigate("/home");
      return;
    }
    navigate("/auth/signin");
    return;
  }, [navigate]);

  // State for checkout and cart data
  const [cartData, setCartData] = useState<any>(null);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<any>(true);
  const [processingPayment, setProcessingPayment] = useState<any>(false);
  const [subtotal, setSubtotal] = useState<any>(0);
  // Base discount and tax: TODO - make configurable by admin
  const BASE_DISCOUNT = 0; // TODO: Admin config
  const TAX_RATE = 0; // TODO: Admin config
  const [discount, setDiscount] = useState<any>(BASE_DISCOUNT);
  const [tax, setTax] = useState<any>(0);
  const [total, setTotal] = useState<any>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // ---- NEW: simple form validation helpers ----
  const [touched, setTouched] = useState<any>({
    country: false,
    state: false,
    paymentMethod: false,
  });
  const [errors, setErrors] = useState<any>({
    country: "",
    state: "",
    paymentMethod: "",
  });

  const validate = (fd, pm) => {
    const nextErrors = {
      country: fd.country.trim() ? "" : "Country is required.",
      state: fd.state.trim() ? "" : "State/Union Territory is required.",
      paymentMethod: pm ? "" : "Please select a payment method.",
    };
    setErrors(nextErrors);
    // valid if all messages are empty
    return !Object.values(nextErrors).some(Boolean);
  };

  // Check user authentication and create checkout session
  useEffect(() => {
    const initializeCheckout = async () => {
      // Check authentication
      const token =
        localStorage.getItem("token") || localStorage.getItem("actkn");
      if (!token) {
        toast.error("Login to proceed to checkout");
        navigate("/auth/signin");
        return;
      }

      const userStr = localStorage.getItem("user");
      let user = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        user = null;
      }

      if (!hasUserRole(user, "mentee")) {
        toast.error("Chỉ mentee mới có thể thanh toán");
        navigate("/auth/signin");
        return;
      }

      dispatch(showLoading());
      setLoading(true);

      try {
        // Get selected courses from navigation state.
        let coursesToUse = [];
        let cartDataFromState = null;

        if (location.state) {
          coursesToUse = location.state.selectedCourses || [];
          cartDataFromState = location.state.cartData;
        }

        // If no courses selected, redirect to cart
        if (coursesToUse.length === 0) {
          toast.warning("Vui lòng chọn khóa học để thanh toán");
          navigate("/shoppingcart");
          return;
        }

        setSelectedCourses(coursesToUse);
        setCartData(cartDataFromState);

        // Calculate totals
        const newSubtotal = coursesToUse.reduce(
          (sum, c) => sum + (c.price || 0),
          0
        );
        setSubtotal(newSubtotal);
        setDiscount(BASE_DISCOUNT);
        setTax((newSubtotal - BASE_DISCOUNT) * TAX_RATE);
        setTotal(
          newSubtotal - BASE_DISCOUNT + (newSubtotal - BASE_DISCOUNT) * TAX_RATE
        );
      } catch (error) {
        console.error("Checkout initialization error:", error);
        toast.error("Có lỗi xảy ra khi khởi tạo thanh toán");
        navigate("/shoppingcart");
      } finally {
        dispatch(hideLoading());
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [navigate, location.state, dispatch]);

  const [paymentMethod, setPaymentMethod] = useState<any>("");
  const [couponCode, setCouponCode] = useState<any>("");
  const [showCouponInput, setShowCouponInput] = useState<any>(false);
  const [couponMessage, setCouponMessage] = useState<any>("");
  const [couponMessageType, setCouponMessageType] = useState<any>(""); // "success" or "error"
  const [showMomoQR, setShowMomoQR] = useState<any>(false);
  const [showBankQR, setShowBankQR] = useState<any>(false);
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [formData, setFormData] = useState<any>({
    country: "",
    state: "",
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
  });

  // convenience to compute if form is valid (for disabling the button)
  const isFormValid =
    formData.country.trim() && formData.state.trim() && paymentMethod;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProceedToCheckout = async () => {
    // run validation once more on click
    const ok = validate(formData, paymentMethod);
    setTouched({ country: true, state: true, paymentMethod: true });
    if (!ok) return;

    setProcessingPayment(true);
    dispatch(showLoading());

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const provider = resolvePaymentProvider(paymentMethod);
      const billingInfo = {
        country: formData.country,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: formData.address || formData.state,
      };

      const { response: orderResponse, error: orderError } =
        await orderApi.createOrder({
        courses: selectedCourses.map((course) => ({
          courseId: course._id,
        })),
          billingInfo,
          paymentMethod: provider,
          discountCode: appliedCoupon?.code,
        }, dispatch);

      if (orderError) {
        throw new Error(orderError?.data?.message || orderError?.message || "Không thể tạo đơn hàng");
      }
      const order = orderResponse?.data?.order;
      if (!order?.orderNumber) {
        throw new Error("Không nhận được thông tin đơn hàng");
      }

      const { response: paymentResponse, error: paymentError } =
        await checkoutApi.createPayment({
          provider,
          orderNumber: order.orderNumber,
        });
      if (paymentError) {
        throw new Error(paymentError?.data?.message || paymentError?.message || "Không thể tạo phiên thanh toán");
      }
      const paymentUrl = paymentResponse?.data?.paymentUrl;
      if (!paymentUrl) throw new Error("Cổng thanh toán không trả về đường dẫn");

      window.location.assign(paymentUrl);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Thanh toán thất bại");
    } finally {
      setProcessingPayment(false);
      dispatch(hideLoading());
    }
  };

  const applyCouponCode = () => {
    if (!showCouponInput) {
      setShowCouponInput(true);
      setCouponMessage("");
    } else if (couponCode.trim()) {
      setCouponMessage("Coupon codes are not available yet.");
      setCouponMessageType("error");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(BASE_DISCOUNT);
    const newTax = (subtotal - BASE_DISCOUNT) * TAX_RATE;
    setTax(newTax);
    setTotal(subtotal - BASE_DISCOUNT + newTax);
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
    <div className="min-h-[100dvh] bg-[var(--ui-page)]">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang khởi tạo thanh toán...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Checkout Form */}
            <div className="lg:col-span-2">
              <h1 className="mb-6 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ui-text)]">
                Secure checkout
              </h1>

              {/* Billing Information */}
              <div className="ui-card mb-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      placeholder="Enter Country"
                      value={formData.country}
                      onChange={handleInputChange}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, country: true }));
                        validate(formData, paymentMethod);
                      }}
                      aria-invalid={!!errors.country && touched.country}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.country && touched.country
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.country && touched.country && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.country}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Union Territory{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      placeholder="Enter State"
                      value={formData.state}
                      onChange={handleInputChange}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, state: true }));
                        validate(formData, paymentMethod);
                      }}
                      aria-invalid={!!errors.state && touched.state}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.state && touched.state
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.state && touched.state && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.state}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Method <span className="text-red-600">*</span>
                  </h3>
                  {errors.paymentMethod && touched.paymentMethod && (
                    <p className="text-xs text-red-600">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* Credit/Debit Card Option */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 mb-4">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Credit/Debit Card"
                      disabled
                      checked={paymentMethod === "Credit/Debit Card"}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setShowMomoQR(false);
                        setShowBankQR(false);
                        setTouched((t) => ({ ...t, paymentMethod: true }));
                        validate(formData, e.target.value);
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 font-medium">
                      Credit/Debit Card (Coming soon)
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
                        setShowMomoQR(false);
                        setShowBankQR(false);
                        setTouched((t) => ({ ...t, paymentMethod: true }));
                        validate(formData, e.target.value);
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
                          Scan QR code with MoMo app to pay {formatCurrency(total)}
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
                      disabled
                      checked={paymentMethod === "Bank Transfer"}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setShowBankQR(true);
                        setShowMomoQR(false);
                        setTouched((t) => ({ ...t, paymentMethod: true }));
                        validate(formData, e.target.value);
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 font-medium">
                      Bank Transfer (Coming soon)
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
                              <p className="text-sm text-gray-600">
                                Bank QR Code
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Account: 1234567890
                              </p>
                              <p className="text-xs text-gray-500">
                                Vietcombank
                              </p>
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
                          <p className="text-sm text-gray-600">
                            Amount: {formatCurrency(total)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Reference: MENTORME CHECKOUT
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* VNPAY Option */}
                <div className="mb-6">
                  <label className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="VNPAY"
                        checked={paymentMethod === "VNPAY"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setShowMomoQR(false);
                          setShowBankQR(false);
                          setTouched((t) => ({ ...t, paymentMethod: true }));
                          validate(formData, e.target.value);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900 font-medium">VNPAY</span>
                    </div>
                    <img src={vnpayLogo} alt="VNPAY" style={{ height: 24 }} />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <h2 className="mb-6 text-2xl font-extrabold tracking-[-0.025em] text-[var(--ui-text)]">
                Order Details
              </h2>

              <div className="ui-card sticky top-24 p-6">
                {/* Course Summary */}
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {selectedCourses.length} Course
                    {selectedCourses.length > 1 ? "s" : ""} Selected
                  </h3>
                  <p className="text-xs text-gray-500">
                    Total{" "}
                    {selectedCourses.reduce(
                      (sum, course) => sum + course.lectures,
                      0
                    )}{" "}
                    Lectures •{" "}
                    {selectedCourses.reduce(
                      (sum, course) => sum + course.duration,
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
                          src={course.thumbnail || course.imageUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 text-sm truncate">
                          {course.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          By {course.mentor?.firstName}{" "}
                          {course.mentor?.lastName}
                        </p>
                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(course.rate)}
                          <span className="text-sm font-medium text-gray-900">
                            {course.rate}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({course.numberOfRatings} ratings)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {course.lectures} Lectures • {course.duration} Hours
                        </p>
                        <div className="mb-1">
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Category: {course.category}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(course.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code */}
                <div className="mb-6">
                  {/* Coupon Input UI */}
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Coupon "{appliedCoupon.code}" applied!
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={applyCouponCode}
                      className="w-full flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-2"
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
                    <div className="mt-3 space-y-3 relative">
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
                      -{formatCurrency(BASE_DISCOUNT)}
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
                  disabled={!isFormValid || processingPayment}
                  className={`w-full text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center
                  ${
                    isFormValid && !processingPayment
                      ? "bg-gray-900 hover:bg-gray-800"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onMouseEnter={() => {
                    // khi hover mà chưa hợp lệ, đánh dấu các field đã "touched" để hiện lỗi
                    if (!isFormValid && !processingPayment) {
                      setTouched({
                        country: true,
                        state: true,
                        paymentMethod: true,
                      });
                      validate(formData, paymentMethod);
                    }
                  }}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </button>

                {!isFormValid && !processingPayment && (
                  <p className="mt-2 text-xs text-gray-500">
                    Vui lòng nhập Country, State và chọn Payment Method để tiếp
                    tục.
                  </p>
                )}

                {processingPayment && (
                  <p className="mt-2 text-xs text-blue-600 text-center">
                    Đang xử lý thanh toán, vui lòng không đóng trang...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
