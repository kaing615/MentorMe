export type PaymentProvider = "vnpay" | "momo";

export const resolvePaymentProvider = (method: string): PaymentProvider => {
  if (method === "VNPAY") return "vnpay";
  if (method === "Momo") return "momo";
  throw new Error(`${method || "Payment method"} is not supported`);
};

export const paymentReturnOrderNumber = (
  provider: PaymentProvider,
  params: URLSearchParams,
): string =>
  params.get(provider === "vnpay" ? "vnp_TxnRef" : "orderId") || "";
