// Format ISO date to dd/MM/yyyy HH:mm
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/loading.slice";
import { toast } from "react-toastify";
import orderApi from "../api/modules/order.api";
import { formatVnd as formatCurrency } from "../utils/currency";
import { isSuccessfulOrderStatus } from "../utils/payment-flow";
import { hasUserRole } from "../utils/user-role";

const OrderComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const [orderInfo, setOrderInfo] = useState<any>(location.state?.orderInfo);
  const [loading, setLoading] = useState<any>(!orderInfo);
  const [error, setError] = useState<any>(null);

  // Check user authentication and fetch order if needed
  useEffect(() => {
    const initializeOrderPage = async () => {
      // Check authentication
      const token =
        localStorage.getItem("token") || localStorage.getItem("actkn");
      if (!token) {
        toast.error("Login to view order");
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
        toast.error("Chỉ mentee mới có thể xem đơn hàng");
        navigate("/auth/signin");
        return;
      }

      // If orderInfo is available from navigation state, use it
      if (orderInfo) {
        setLoading(false);
        return;
      }

      // Otherwise, try to fetch order by ID from URL params
      const orderId = searchParams.get("orderId");
      if (!orderId) {
        setError("Không tìm thấy ID đơn hàng");
        setLoading(false);
        return;
      }

      dispatch(showLoading());

      try {
        const { response, error: fetchError } = await orderApi.getOrderDetails({
          orderId,
        });

        if (fetchError) {
          throw new Error(
            fetchError.message || "Không thể tải thông tin đơn hàng"
          );
        }

        const fetchedOrder = response.data.order;
        setOrderInfo(fetchedOrder);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(error.message);
        toast.error(error.message || "Có lỗi xảy ra khi tải đơn hàng");
      } finally {
        dispatch(hideLoading());
        setLoading(false);
      }
    };

    initializeOrderPage();
  }, [navigate, dispatch, orderInfo, searchParams]);

  const handleContinueShopping = () => {
    navigate("/all-courses");
  };

  const handleBackToHome = () => navigate("/");

  const handleBackToProfile = () => {
    navigate("/profile");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !orderInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Lỗi đơn hàng
          </h1>
          <p className="text-gray-700 mb-6">
            {error || "Không tìm thấy thông tin đơn hàng"}
          </p>
          <div className="space-x-4">
            <button
              onClick={handleContinueShopping}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Khám phá khóa học
            </button>
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const successful = isSuccessfulOrderStatus(orderInfo.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div
              className={`w-24 h-24 ${successful ? "bg-green-500" : "bg-red-500"} rounded-full flex items-center justify-center mx-auto`}
            >
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
                  d={successful ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
                />
              </svg>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {successful ? "Order Complete" : "Payment Failed"}
            </h1>
            <p className="text-gray-600 text-lg">
              {successful
                ? "You will receive a confirmation email soon!"
                : "Your payment was not completed. You can safely try again."}
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
                    {orderInfo._id || orderInfo.orderNumber || "Unavailable"}
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
                  <span
                    className={`font-medium ${successful ? "text-green-600" : "text-red-600"} capitalize`}
                  >
                    {orderInfo?.status || "Unavailable"}
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
              <span
                className={`text-xl font-bold ${successful ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(orderInfo.total)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={successful ? handleBackToProfile : () => navigate("/shoppingcart")}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {successful ? "Quay về trang chủ" : "Thử thanh toán lại"}
            </button>

            <button
              onClick={handleContinueShopping}
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Khám phá thêm khóa học
            </button>
          </div>

          {successful && (
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
          )}

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
