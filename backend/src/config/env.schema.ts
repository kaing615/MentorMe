export type Environment = {
  PORT: number;
  MONGO_URL: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string;
  NODE_ENV: string;
};

const required = (source: Record<string, unknown>, key: string): string => {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
};

export const validateEnvironment = (
  source: Record<string, unknown>,
): Record<string, unknown> & Environment => {
  const port = Number(source.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return {
    ...source,
    PORT: port,
    MONGO_URL: required(source, "MONGO_URL"),
    JWT_SECRET: required(source, "JWT_SECRET"),
    CORS_ORIGINS: required(source, "CORS_ORIGINS"),
    NODE_ENV:
      typeof source.NODE_ENV === "string" ? source.NODE_ENV : "development",
  };
};
