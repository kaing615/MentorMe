import http from "node:http";
import createApp from "./app.js";
import loadEnv from "./config/env.js";
import { connectMongo, disconnectMongo } from "./infrastructure/mongodb.js";
import createLogger from "./infrastructure/logger.js";
import { createRedisClients } from "./infrastructure/redis/redis.client.js";
import { createMetrics } from "./infrastructure/observability/metrics.js";
import attachSocket from "./socket/index.js";

function closeHttpServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function closeSocket(io) {
  if (!io) return Promise.resolve();
  return new Promise((resolve) => io.close(resolve));
}

export async function shutdownRuntime({
  health,
  server,
  io,
  closeDependencies,
  timeoutMs,
}) {
  health.acceptingTraffic = false;
  const close = Promise.all([
    closeSocket(io),
    closeHttpServer(server),
    closeDependencies(),
  ]);
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`Graceful shutdown exceeded ${timeoutMs}ms`)),
      timeoutMs
    );
    timeout.unref?.();
  });
  try {
    await Promise.race([close, deadline]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function startServer({ source = process.env } = {}) {
  const env = loadEnv(source);
  const logger = createLogger({ level: env.logLevel });
  const health = {
    acceptingTraffic: true,
    dependencies: {
      mongo: false,
      redis: !env.redisEnabled,
      rabbitmq: !env.rabbitmqEnabled,
    },
  };
  const metrics = createMetrics();
  await connectMongo(env.mongoUrl);
  health.dependencies.mongo = true;

  let redisClients = null;
  if (env.redisEnabled) {
    try {
      redisClients = await createRedisClients(env.redisUrl, {
        logger,
        onStateChange: (ready) => {
          health.dependencies.redis = ready;
        },
      });
      health.dependencies.redis = true;
    } catch (error) {
      health.dependencies.redis = false;
      logger.warn({ err: error }, "Redis unavailable; starting degraded");
    }
  }

  const app = createApp({
    env,
    health,
    logger,
    redisClient: redisClients?.command,
    metrics,
  });
  const server = http.createServer(app);
  const io = attachSocket(server, {
    corsOrigins: env.corsOrigins,
    logger,
    redisClients,
    webSocketOnly: env.nodeEnv === "production",
    jwtAccessSecret: env.jwtAccessSecret,
  });
  await new Promise((resolve) => server.listen(env.port, resolve));
  logger.info({ port: env.port }, "MentorMe API listening");

  let shuttingDown = false;
  const stop = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutdown started");
    try {
      await shutdownRuntime({
        health,
        server,
        io,
        closeDependencies: async () => {
          await redisClients?.close();
          await disconnectMongo();
        },
        timeoutMs: env.shutdownTimeoutMs,
      });
      logger.info("shutdown completed");
    } catch (error) {
      logger.error({ err: error }, "shutdown failed");
      process.exitCode = 1;
    }
  };
  process.once("SIGTERM", () => void stop("SIGTERM"));
  process.once("SIGINT", () => void stop("SIGINT"));
  return { app, env, health, io, server, stop };
}

export default startServer;
