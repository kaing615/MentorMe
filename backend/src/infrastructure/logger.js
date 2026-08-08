import pino from "pino";

export function createLogger({ level = "info" } = {}) {
  return pino({
    level,
    base: undefined,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "request.headers.authorization",
        "request.headers.cookie",
        "password",
        "token",
        "refreshToken",
        "paymentData",
      ],
      censor: "[REDACTED]",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export default createLogger;
