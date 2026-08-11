import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import publicClient from "../api/clients/public.client";
import {
  isSuccessfulOrderStatus,
  paymentReturnOrderNumber,
  paymentReturnPath,
  type PaymentProvider,
} from "../utils/payment-flow";

const PaymentReturnPage = ({ provider }: { provider: PaymentProvider }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const finish = async () => {
      const bookingReturn = sessionStorage.getItem("paymentReturnTarget") === "booking";
      sessionStorage.removeItem("paymentReturnTarget");
      let orderNumber = paymentReturnOrderNumber(provider, searchParams);
      try {
        if (provider === "vnpay") {
          const response: any = await publicClient.get("/payment/vnpay/return", {
            params: Object.fromEntries(searchParams.entries()),
          });
          const order = response?.data?.order;
          orderNumber = order?.orderNumber || orderNumber;
          if (isSuccessfulOrderStatus(order?.status)) {
            toast.success(response?.data?.message || "Thanh toán thành công");
          } else {
            toast.error(response?.data?.message || "Thanh toán thất bại");
          }
        }
        if (!orderNumber) throw new Error("Không tìm thấy mã đơn hàng");
        if (bookingReturn) {
          localStorage.setItem("menteeProfileTab", "mybookings");
        }
        navigate(paymentReturnPath(orderNumber, bookingReturn), { replace: true });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể xác minh thanh toán");
        if (bookingReturn) {
          localStorage.setItem("menteeProfileTab", "mybookings");
          navigate("/profile", { replace: true });
        } else {
          navigate("/shoppingcart", { replace: true });
        }
      }
    };
    void finish();
  }, [navigate, provider, searchParams]);

  return <div className="min-h-[50vh] grid place-items-center">Đang xác minh thanh toán…</div>;
};

export default PaymentReturnPage;
