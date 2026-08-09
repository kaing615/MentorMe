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
export class MomoProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  async create(input: CreatePaymentInput) {
    const partnerCode = this.value("MOMO_PARTNER_CODE", "DEMO_PARTNER_CODE");
    const accessKey = this.value("MOMO_ACCESS_KEY", "DEMO_ACCESS_KEY");
    const requestId = `${input.orderNumber}_${Date.now()}`;
    const redirectUrl =
      this.config.get<string>("MOMO_REDIRECT_URL") ?? input.returnUrl;
    const ipnUrl =
      this.config.get<string>("MOMO_IPN_URL") ??
      "http://localhost:4000/api/v1/payment/momo/ipn";
    const orderInfo = `Thanh toan don hang ${input.orderNumber}`;
    const fields: Record<string, string> = {
      partnerCode,
      requestId,
      amount: String(input.amount),
      orderId: input.orderNumber,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType: "captureWallet",
      extraData: "",
      lang: "vi",
    };
    const raw = [
      `accessKey=${accessKey}`,
      `amount=${fields.amount}`,
      `extraData=`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${input.orderNumber}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=captureWallet`,
    ].join("&");
    const response = await fetch(
      this.config.get<string>("MOMO_ENDPOINT") ??
        "https://test-payment.momo.vn/v2/gateway/api/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, amount: input.amount, signature: this.sign(raw) }),
      },
    );
    const data: unknown = await response.json();
    if (!response.ok || !this.record(data) || data.resultCode !== 0) {
      throw new BadRequestException("Tạo thanh toán MoMo thất bại!");
    }
    if (typeof data.payUrl !== "string") {
      throw new BadRequestException("MoMo did not return a payment URL");
    }
    return { redirectUrl: data.payUrl, providerReference: requestId };
  }

  verifyCallback(input: PaymentCallbackInput): Promise<VerifiedPayment> {
    if (!this.record(input.body)) throw new BadRequestException("Invalid MoMo callback");
    const body = input.body;
    const value = (key: string): string => {
      const item = body[key];
      return typeof item === "string" || typeof item === "number"
        ? String(item)
        : "";
    };
    const raw = [
      `accessKey=${this.value("MOMO_ACCESS_KEY", "DEMO_ACCESS_KEY")}`,
      `amount=${value("amount")}`,
      `extraData=${value("extraData")}`,
      `message=${value("message")}`,
      `orderId=${value("orderId")}`,
      `orderInfo=${value("orderInfo")}`,
      `orderType=${value("orderType")}`,
      `partnerCode=${value("partnerCode")}`,
      `payType=${value("payType")}`,
      `requestId=${value("requestId")}`,
      `responseTime=${value("responseTime")}`,
      `resultCode=${value("resultCode")}`,
      `transId=${value("transId")}`,
    ].join("&");
    if (!this.equal(value("signature"), this.sign(raw))) {
      throw new BadRequestException("Invalid signature");
    }
    if (!value("orderId") || !value("transId")) {
      throw new BadRequestException("Invalid MoMo callback");
    }
    return Promise.resolve({
      provider: "momo",
      eventId: value("transId"),
      transactionId: value("transId"),
      orderNumber: value("orderId"),
      amount: Number(value("amount")),
      status: Number(value("resultCode")) === 0 ? "paid" : "failed",
    });
  }

  private sign(raw: string): string {
    return crypto
      .createHmac("sha256", this.value("MOMO_SECRET_KEY", "DEMO_SECRET_KEY"))
      .update(raw)
      .digest("hex");
  }

  private equal(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  private value(key: string, fallback: string): string {
    return this.config.get<string>(key) ?? fallback;
  }

  private record(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }
}
