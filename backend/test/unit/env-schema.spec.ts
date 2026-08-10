import { validateEnvironment } from "../../src/config/env.schema";

const valid = {
  MONGO_URL: "mongodb://localhost/test",
  JWT_SECRET: "test-secret",
  CORS_ORIGINS: "http://localhost:3000",
  VNPAY_ENABLED: "true",
  MOMO_ENABLED: "true",
  VNPAY_TMN_CODE: "tmn-code",
  VNPAY_HASH_SECRET: "vnpay-secret",
  MOMO_PARTNER_CODE: "partner-code",
  MOMO_ACCESS_KEY: "access-key",
  MOMO_SECRET_KEY: "momo-secret",
};

describe("payment environment", () => {
  it.each([
    "VNPAY_TMN_CODE",
    "VNPAY_HASH_SECRET",
    "MOMO_PARTNER_CODE",
    "MOMO_ACCESS_KEY",
    "MOMO_SECRET_KEY",
  ])("rejects a missing or blank %s", (key) => {
    expect(() => validateEnvironment({ ...valid, [key]: "  " })).toThrow(
      `${key} is required`,
    );
  });

  it("allows missing credentials only when both gateways are disabled", () => {
    expect(() =>
      validateEnvironment({
        ...valid,
        VNPAY_ENABLED: "false",
        MOMO_ENABLED: "false",
        VNPAY_TMN_CODE: "",
        VNPAY_HASH_SECRET: "",
        MOMO_PARTNER_CODE: "",
        MOMO_ACCESS_KEY: "",
        MOMO_SECRET_KEY: "",
      }),
    ).not.toThrow();
  });
});
