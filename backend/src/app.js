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
import { createCacheStore } from "./infrastructure/redis/cache-store.js";
import requestContext from "./middlewares/request-context.middleware.js";
import { rejectMongoOperators } from "./middlewares/security.middleware.js";
import { createRateLimit } from "./middlewares/rate-limit.middleware.js";
import {
  createResponseCache,
  invalidateCacheOnSuccess,
} from "./middlewares/response-cache.middleware.js";
import { verifyAccessToken } from "./modules/identity/access-token.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function dependencyBody(health) {
  return Object.fromEntries(
    Object.entries(health.dependencies).map(([name, ready]) => [
      name,
      ready ? "up" : "down",
    ])
  );
}

function publicCacheNamespace(request) {
  if (request.method !== "GET") return null;
  const pathname = request.originalUrl.split("?", 1)[0];
  if (/^\/api\/v1\/(?:course|courses)(?:\/|$)/.test(pathname)) {
    if (/\/my-courses(?:\/|$)/.test(pathname)) return null;
    if (/\/purchase-status(?:\/|$)/.test(pathname)) return null;
    return "course";
  }
  if (
    /^\/api\/v1\/profile\/(?:top-mentors|mentor\/[^/]+)\/?$/.test(pathname)
  ) {
    return "profile";
  }
  return null;
}

function mutationCacheNamespaces(request) {
  if (request.method === "GET") return [];
  const pathname = request.originalUrl.split("?", 1)[0];
  if (/^\/api\/v1\/(?:course|courses|profile)(?:\/|$)/.test(pathname)) {
    return ["course", "profile"];
  }
  return [];
}

export function createApp({
  env = loadEnv(process.env),
  health = {
    acceptingTraffic: true,
    dependencies: { mongo: false, redis: false, rabbitmq: false },
  },
  logger = createLogger({ level: "silent" }),
  redisClient,
  cacheStore,
  applicationRouter,
  includeApplicationRoutes = true,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestContext);
  app.use((_request, response, next) => {
    response.set("x-instance-id", env.instanceId || "unknown");
    next();
  });
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
  app.use(rejectMongoOperators);

  app.get("/health/live", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.get("/health/ready", (_request, response) => {
    const dependencies = dependencyBody(health);
    const serving = health.acceptingTraffic && health.dependencies.mongo;
    const allDependenciesReady = Object.values(health.dependencies).every(Boolean);
    const status = !serving
      ? "not_ready"
      : allDependenciesReady
        ? "ready"
        : "degraded";
    response.status(serving ? 200 : 503).json({
      status,
      dependencies,
    });
  });

  if (includeApplicationRoutes) {
    const unavailableRedis = {
      async eval() {
        throw new Error("Redis is unavailable");
      },
    };
    const limiterClient = redisClient || unavailableRedis;
    const loginLimit = createRateLimit({
      redisClient: limiterClient,
      key: (request) => `auth:${request.ip}`,
      limit: 5,
      windowMs: 60_000,
      failureMode: "local-half",
      logger,
    });
    const publicReadLimit = createRateLimit({
      redisClient: limiterClient,
      key: (request) => `read:${request.ip}`,
      limit: 60,
      windowMs: 60_000,
      failureMode: "open",
      logger,
    });
    const writeLimit = createRateLimit({
      redisClient: limiterClient,
      key: (request) => {
        const token = request.get("authorization")?.replace(/^Bearer\s+/i, "");
        try {
          const payload = verifyAccessToken(token, {
            secret: env.jwtAccessSecret,
          });
          return `write:${payload.id || payload.sub}`;
        } catch {
          return `write-ip:${request.ip}`;
        }
      },
      limit: 30,
      windowMs: 60_000,
      failureMode: "local-half",
      logger,
    });
    app.use("/api/v1/user/signin", loginLimit);
    app.use("/api/v1/user/signup", loginLimit);
    app.use("/api/v1/user/signupMentor", loginLimit);
    app.use("/api/v1", (request, response, next) =>
      request.method === "GET"
        ? publicReadLimit(request, response, next)
        : writeLimit(request, response, next)
    );

    const sharedCache = cacheStore || (redisClient ? createCacheStore(redisClient) : null);
    if (sharedCache) {
      const responseCache = createResponseCache({
        cache: sharedCache,
        namespace: publicCacheNamespace,
        ttlSeconds: 300,
        key: (request) => request.originalUrl,
      });
      const invalidateResponseCache = invalidateCacheOnSuccess({
        cache: sharedCache,
        namespaces: mutationCacheNamespaces,
      });
      app.use("/api/v1", (request, response, next) => {
        if (publicCacheNamespace(request)) {
          return responseCache(request, response, next);
        }
        if (mutationCacheNamespaces(request).length > 0) {
          return invalidateResponseCache(request, response, next);
        }
        return next();
      });
    }

    const routesPromise = applicationRouter
      ? Promise.resolve(applicationRouter)
      : import("./routes/index.js").then((module) => module.default);
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
