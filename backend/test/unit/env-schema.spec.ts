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
  SITE_ADMIN_EMAIL: "site-admin@example.com",
  SITE_ADMIN_PASSWORD: "SafePassword1!",
  SITE_ADMIN_FIRST_NAME: "Site",
  SITE_ADMIN_LAST_NAME: "Administrator",
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

describe("site administrator environment", () => {
  it.each([
    "SITE_ADMIN_EMAIL",
    "SITE_ADMIN_PASSWORD",
    "SITE_ADMIN_FIRST_NAME",
    "SITE_ADMIN_LAST_NAME",
  ])("rejects a missing or blank %s outside tests", (key) => {
    expect(() =>
      validateEnvironment({ ...valid, NODE_ENV: "development", [key]: "  " }),
    ).toThrow(`${key} is required`);
  });

  it("allows test suites to provide bootstrap defaults later", () => {
    const withoutSiteAdmin = Object.fromEntries(
      Object.entries(valid).filter(([key]) => !key.startsWith("SITE_ADMIN_")),
    );
    expect(() => validateEnvironment({ ...withoutSiteAdmin, NODE_ENV: "test" })).not.toThrow();
  });
});
