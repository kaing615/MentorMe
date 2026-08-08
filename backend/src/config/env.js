const DEVELOPMENT_DEFAULTS = {
  PORT: "4000",
  MONGO_URL: "mongodb://localhost:27017/mentorme",
  JWT_ACCESS_SECRET: "development-access-secret-change-before-production",
  JWT_REFRESH_SECRET: "development-refresh-secret-change-before-production",
  CORS_ORIGINS: "http://localhost:5173",
  FRONTEND_URL: "http://localhost:5173",
  PUBLIC_API_URL: "http://localhost:4000",
  REDIS_URL: "redis://localhost:6379",
  RABBITMQ_URL: "amqp://guest:guest@localhost:5672",
  SHUTDOWN_TIMEOUT_MS: "10000",
  LOG_LEVEL: "info",
};

const REQUIRED_PRODUCTION = [
  "MONGO_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CORS_ORIGINS",
  "FRONTEND_URL",
  "PUBLIC_API_URL",
  "REDIS_URL",
  "RABBITMQ_URL",
];

function parseInteger(name, value, { minimum, maximum }) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return parsed;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Boolean environment value must be true or false, received ${value}`);
}

function parseHttpUrl(name, value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  return parsed.origin;
}

export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV || "development";
  const production = nodeEnv === "production";
  const values = production ? { ...source } : { ...DEVELOPMENT_DEFAULTS, ...source };

  if (production) {
    for (const name of REQUIRED_PRODUCTION) {
      if (!values[name]?.trim()) throw new Error(`${name} is required in production`);
    }
  }

  for (const name of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
    if (!values[name] || values[name].length < 32) {
      throw new Error(`${name} must contain at least 32 characters`);
    }
  }

  const corsOrigins = values.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => parseHttpUrl("CORS_ORIGINS", origin));
  if (corsOrigins.length === 0 || corsOrigins.includes("*")) {
    throw new Error("CORS_ORIGINS must contain explicit origins");
  }

  const result = {
    nodeEnv,
    instanceId: values.INSTANCE_ID || "local",
    port: parseInteger("PORT", values.PORT, { minimum: 1, maximum: 65535 }),
    mongoUrl: values.MONGO_URL,
    jwtAccessSecret: values.JWT_ACCESS_SECRET,
    jwtRefreshSecret: values.JWT_REFRESH_SECRET,
    corsOrigins: Object.freeze(corsOrigins),
    frontendUrl: parseHttpUrl("FRONTEND_URL", values.FRONTEND_URL),
    publicApiUrl: parseHttpUrl("PUBLIC_API_URL", values.PUBLIC_API_URL),
    redisUrl: values.REDIS_URL,
    rabbitmqUrl: values.RABBITMQ_URL,
    redisEnabled: parseBoolean(values.REDIS_ENABLED, production),
    rabbitmqEnabled: parseBoolean(values.RABBITMQ_ENABLED, production),
    shutdownTimeoutMs: parseInteger(
      "SHUTDOWN_TIMEOUT_MS",
      values.SHUTDOWN_TIMEOUT_MS,
      { minimum: 100, maximum: 60000 }
    ),
    logLevel: values.LOG_LEVEL,
  };
  return Object.freeze(result);
}

export default loadEnv;
