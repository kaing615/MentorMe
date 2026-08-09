export type CreatePaymentInput = {
  orderNumber: string;
  amount: number;
  ipAddress: string;
  returnUrl: string;
};

export type PaymentCallbackInput = {
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type VerifiedPayment = {
  provider: "vnpay" | "momo";
  eventId: string;
  transactionId: string;
  orderNumber: string;
  amount: number;
  status: "paid" | "failed";
};

export interface PaymentProvider {
  create(input: CreatePaymentInput): Promise<{
    redirectUrl: string;
    providerReference: string;
  }>;
  verifyCallback(input: PaymentCallbackInput): Promise<VerifiedPayment>;
}
