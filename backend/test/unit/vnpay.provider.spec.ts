import crypto from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { VnpayProvider } from "../../src/commerce/providers/vnpay.provider";

const secret = "test-vnpay-hash-secret";

const sign = (params: Record<string, string>): string => {
  const data = new URLSearchParams(
    Object.entries(params).sort(([left], [right]) => left.localeCompare(right)),
  ).toString();
  return crypto.createHmac("sha512", secret).update(data).digest("hex");
};

describe("VnpayProvider", () => {
  const provider = new VnpayProvider(
    new ConfigService({
      VNPAY_ENABLED: true,
      VNPAY_HASH_SECRET: secret,
      VNPAY_TMN_CODE: "TEST_TMN_CODE",
      VNPAY_URL: "https://sandbox.example/pay",
    }),
  );

  it("signs the URL-encoded payment query", async () => {
    const { redirectUrl } = await provider.create({
      amount: 250000,
      orderNumber: "ORDER 01",
      ipAddress: "127.0.0.1",
      returnUrl: "http://localhost:3000/payment/vnpay/return?source=checkout",
    });
    const url = new URL(redirectUrl);
    const params = Object.fromEntries(url.searchParams.entries());
    const signature = params.vnp_SecureHash;
    delete params.vnp_SecureHash;

    expect(signature).toBe(sign(params));
  });

  it("verifies callbacks signed from URL-encoded values", async () => {
    const params: Record<string, string> = {
      vnp_Amount: "25000000",
      vnp_OrderInfo: "Thanh toán đơn hàng ORDER 01",
      vnp_ResponseCode: "00",
      vnp_TransactionNo: "VNPAY-01",
      vnp_TransactionStatus: "00",
      vnp_TxnRef: "ORDER 01",
    };

    const payment = await provider.verifyCallback({
      query: { ...params, vnp_SecureHash: sign(params) },
      body: {},
      headers: {},
    });

    expect(payment.status).toBe("paid");
    expect(payment.orderNumber).toBe("ORDER 01");
  });
});
