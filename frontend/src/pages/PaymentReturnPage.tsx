import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import publicClient from "../api/clients/public.client";
import {
  paymentReturnOrderNumber,
  type PaymentProvider,
} from "../utils/payment-flow";

const PaymentReturnPage = ({ provider }: { provider: PaymentProvider }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const finish = async () => {
      let orderNumber = paymentReturnOrderNumber(provider, searchParams);
      try {
        if (provider === "vnpay") {
          const response: any = await publicClient.get("/payment/vnpay/return", {
            params: Object.fromEntries(searchParams.entries()),
          });
          orderNumber = response?.data?.order?.orderNumber || orderNumber;
          toast.success(response?.data?.message || "Đã xử lý kết quả thanh toán");
        }
        if (!orderNumber) throw new Error("Không tìm thấy mã đơn hàng");
        navigate(`/order-detail?orderId=${encodeURIComponent(orderNumber)}`, {
          replace: true,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể xác minh thanh toán");
        navigate("/shoppingcart", { replace: true });
      }
    };
    void finish();
  }, [navigate, provider, searchParams]);

  return <div className="min-h-[50vh] grid place-items-center">Đang xác minh thanh toán…</div>;
};

export default PaymentReturnPage;
