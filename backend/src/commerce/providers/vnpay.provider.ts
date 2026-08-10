import crypto from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  CreatePaymentInput,
  PaymentCallbackInput,
  PaymentProvider,
  VerifiedPayment,
} from "../payment-provider";

@Injectable()
export class VnpayProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  create(input: CreatePaymentInput) {
    this.assertEnabled();
    const params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.config.getOrThrow<string>("VNPAY_TMN_CODE"),
      vnp_Amount: String(input.amount * 100),
      vnp_CreateDate: new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14),
      vnp_CurrCode: "VND",
      vnp_IpAddr: input.ipAddress,
      vnp_Locale: "vn",
      vnp_OrderInfo: `Thanh toan don hang ${input.orderNumber}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: input.returnUrl,
      vnp_TxnRef: input.orderNumber,
    };
    const signature = this.sign(params);
    const query = new URLSearchParams({ ...params, vnp_SecureHash: signature });
    const base =
      this.config.get<string>("VNPAY_URL") ??
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    return Promise.resolve({
      redirectUrl: `${base}?${query.toString()}`,
      providerReference: input.orderNumber,
    });
  }

  verifyCallback(input: PaymentCallbackInput): Promise<VerifiedPayment> {
    this.assertEnabled();
    const params = { ...input.query };
    const signature = params.vnp_SecureHash ?? "";
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;
    const expected = this.sign(params);
    if (!this.equal(signature, expected)) {
      throw new BadRequestException("Invalid signature");
    }
    const orderNumber = params.vnp_TxnRef;
    const transactionId = params.vnp_TransactionNo ?? orderNumber;
    if (!orderNumber || !transactionId) {
      throw new BadRequestException("Invalid VNPay callback");
    }
    return Promise.resolve({
      provider: "vnpay",
      eventId: transactionId,
      transactionId,
      orderNumber,
      amount: Number(params.vnp_Amount) / 100,
      status:
        params.vnp_ResponseCode === "00" &&
        params.vnp_TransactionStatus === "00"
          ? "paid"
          : "failed",
    });
  }

  private sign(params: Record<string, string>): string {
    const data = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== "")
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    return crypto
      .createHmac(
        "sha512",
        this.config.getOrThrow<string>("VNPAY_HASH_SECRET"),
      )
      .update(data)
      .digest("hex");
  }

  private assertEnabled(): void {
    if (this.config.get<boolean>("VNPAY_ENABLED") !== true) {
      throw new BadRequestException("VNPay is not configured");
    }
  }

  private equal(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
