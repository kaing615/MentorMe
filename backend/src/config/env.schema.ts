export type Environment = {
  PORT: number;
  MONGO_URL: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string;
  NODE_ENV: string;
  VNPAY_ENABLED: boolean;
  VNPAY_TMN_CODE: string;
  VNPAY_HASH_SECRET: string;
  MOMO_PARTNER_CODE: string;
  MOMO_ACCESS_KEY: string;
  MOMO_SECRET_KEY: string;
  MOMO_ENABLED: boolean;
};

const required = (source: Record<string, unknown>, key: string): string => {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
};

const enabled = (source: Record<string, unknown>, key: string): boolean => {
  const value = source[key];
  return value === true || (typeof value === "string" && value.toLowerCase() === "true");
};

const credential = (
  source: Record<string, unknown>,
  key: string,
  providerEnabled: boolean,
): string =>
  providerEnabled
    ? required(source, key)
    : typeof source[key] === "string"
      ? source[key].trim()
      : "";

export const validateEnvironment = (
  source: Record<string, unknown>,
): Record<string, unknown> & Environment => {
  const port = Number(source.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  const vnpayEnabled = enabled(source, "VNPAY_ENABLED");
  const momoEnabled = enabled(source, "MOMO_ENABLED");

  return {
    ...source,
    PORT: port,
    MONGO_URL: required(source, "MONGO_URL"),
    JWT_SECRET: required(source, "JWT_SECRET"),
    CORS_ORIGINS: required(source, "CORS_ORIGINS"),
    VNPAY_ENABLED: vnpayEnabled,
    VNPAY_TMN_CODE: credential(source, "VNPAY_TMN_CODE", vnpayEnabled),
    VNPAY_HASH_SECRET: credential(source, "VNPAY_HASH_SECRET", vnpayEnabled),
    MOMO_ENABLED: momoEnabled,
    MOMO_PARTNER_CODE: credential(source, "MOMO_PARTNER_CODE", momoEnabled),
    MOMO_ACCESS_KEY: credential(source, "MOMO_ACCESS_KEY", momoEnabled),
    MOMO_SECRET_KEY: credential(source, "MOMO_SECRET_KEY", momoEnabled),
    NODE_ENV:
      typeof source.NODE_ENV === "string" ? source.NODE_ENV : "development",
  };
};
