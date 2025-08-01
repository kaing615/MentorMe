import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatCurrency } from "../data/mockCartData";
import { useCart } from "../contexts/CartContext";

const OrderComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCourses, subtotal, discount, tax, total } = useCart();

  // States for order data
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get order ID from URL params
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const loadOrderData = async () => {
      if (orderId) {
        try {
          // TODO: Replace with actual API call when backend is ready
          // const response = await fetch(`/api/orders/${orderId}`);
          // const order = await response.json();

          // Mock data for now - will be replaced with API call
          const mockOrderData = {
            id: orderId,
            orderNumber: `#${orderId}`,
            createdAt: new Date().toLocaleDateString(),
            status: "completed",
            courses: selectedCourses,
            pricing: { subtotal, discount, tax, total },
          };

          setOrderData(mockOrderData);
        } catch (err) {
          setError("Failed to load order details");
          console.error("Error loading order:", err);
        }
      } else {
        // Fallback if no order ID - generate mock data
        const fallbackOrderData = {
          id: Date.now().toString(),
          orderNumber: `#${Date.now()}`,
          createdAt: new Date().toLocaleDateString(),
          status: "completed",
          courses: selectedCourses,
          pricing: { subtotal, discount, tax, total },
        };
        setOrderData(fallbackOrderData);
      }
      setLoading(false);
    };

    loadOrderData();
  }, [orderId, selectedCourses, subtotal, discount, tax, total]);

  const handleContinueShopping = () => {
    navigate("/courses"); // Navigate to courses page
  };

  const handleViewOrder = () => {
    if (orderData?.id) {
      navigate(`/orders/${orderData.id}`); // Navigate to specific order page
    } else {
      navigate("/orders"); // Navigate to orders list page
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/courses")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-16">
        <div className="max-w-md mx-auto text-center">
          {/* Success Icon */}
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

          {/* Success Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Complete
            </h1>
            <p className="text-gray-600 text-lg">
              You Will Receive a confirmation email soon!
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-gray-900">
                    {orderData?.orderNumber || "#Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">
                    {orderData?.createdAt || "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Courses Purchased:</span>
                  <span className="font-medium text-gray-900">
                    {orderData?.courses?.length || selectedCourses.length}{" "}
                    Course
                    {(orderData?.courses?.length || selectedCourses.length) > 1
                      ? "s"
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">
                    {orderData?.status || "Completed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Price Details:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">
                    {formatCurrency(orderData?.pricing?.subtotal || subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-green-600">
                    -{formatCurrency(orderData?.pricing?.discount || discount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold">
                    {formatCurrency(orderData?.pricing?.tax || tax)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="text-center mt-4">
              <div className="text-lg font-semibold text-gray-700 mb-1">
                Total Amount:
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(orderData?.pricing?.total || total)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleContinueShopping}
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </button>
            {orderData?.id && (
              <button
                onClick={handleViewOrder}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Order Details
              </button>
            )}
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
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
              <div className="text-left">
                <h4 className="font-medium text-blue-900 mb-1">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • You'll receive a confirmation email within 5 minutes
                  </li>
                  <li>• Access your course immediately in your dashboard</li>
                  <li>• Start learning at your own pace</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Information */}
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
