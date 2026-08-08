import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import loadEnv from "./config/env.js";
import createLogger from "./infrastructure/logger.js";
import requestContext from "./middlewares/request-context.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function dependencyBody(health) {
  return Object.fromEntries(
    Object.entries(health.dependencies).map(([name, ready]) => [
      name,
      ready ? "up" : "down",
    ])
  );
}

export function createApp({
  env = loadEnv(process.env),
  health = {
    acceptingTraffic: true,
    dependencies: { mongo: false, redis: false, rabbitmq: false },
  },
  logger = createLogger({ level: "silent" }),
  includeApplicationRoutes = true,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestContext);
  app.use(
    pinoHttp({
      logger,
      genReqId: (request) => request.id,
      customProps: (request) => ({ requestId: request.id }),
    })
  );
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
      },
    })
  );
  app.use(helmet());
  app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health/live", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.get("/health/ready", (_request, response) => {
    const dependencies = dependencyBody(health);
    const ready =
      health.acceptingTraffic && Object.values(health.dependencies).every(Boolean);
    response.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      dependencies,
    });
  });

  if (includeApplicationRoutes) {
    const routesPromise = import("./routes/index.js").then(
      (module) => module.default
    );
    app.use("/api/v1", async (request, response, next) => {
      try {
        const routes = await routesPromise;
        routes(request, response, next);
      } catch (error) {
        next(error);
      }
    });
    const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get("/", (_request, response) => response.send("Welcome to MentorMe"));
  }

  app.use((request, response) => {
    response.status(404).json({
      code: "NOT_FOUND",
      message: "Route not found",
      requestId: request.id,
    });
  });
  app.use((error, request, response, _next) => {
    request.log?.error({ err: error }, "request failed");
    const status = error.message === "Origin is not allowed by CORS" ? 403 : 500;
    response.status(status).json({
      code: status === 403 ? "CORS_DENIED" : "INTERNAL_ERROR",
      message: status === 403 ? error.message : "Unexpected server error",
      requestId: request.id,
    });
  });

  return app;
}

export default createApp;
