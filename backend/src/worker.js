import { pathToFileURL } from "node:url";
import loadEnv from "./config/env.js";
import createLogger from "./infrastructure/logger.js";
import { connectMongo as defaultConnectMongo, disconnectMongo as defaultDisconnectMongo } from "./infrastructure/mongodb.js";
import { connectBroker as defaultConnectBroker } from "./infrastructure/rabbitmq/broker.js";
import { declareTopology as defaultDeclareTopology } from "./infrastructure/rabbitmq/topology.js";
import { publishOutboxBatch as defaultPublishOutboxBatch } from "./infrastructure/outbox/publisher.js";
import { consumeEvent as defaultConsumeEvent } from "./infrastructure/outbox/consumer.js";
import { cleanupPublishedOutbox as defaultCleanupPublishedOutbox } from "./infrastructure/outbox/cleanup.js";
import { createProcessedEventStore } from "./infrastructure/outbox/processed-event.store.js";

export async function startWorker(options = {}) {
  const env = options.env || loadEnv(process.env);
  const logger = options.logger || createLogger({ level: env.logLevel });
  const connectMongo = options.connectMongo || defaultConnectMongo;
  const disconnectMongo = options.disconnectMongo || defaultDisconnectMongo;
  const connectBroker = options.connectBroker || defaultConnectBroker;
  const declareTopology = options.declareTopology || defaultDeclareTopology;
  const publishOutboxBatch = options.publishOutboxBatch || defaultPublishOutboxBatch;
  const consumeEvent = options.consumeEvent || defaultConsumeEvent;
  const cleanupPublishedOutbox =
    options.cleanupPublishedOutbox || defaultCleanupPublishedOutbox;
  const store = options.store || createProcessedEventStore();
  const setIntervalFn = options.setIntervalFn || setInterval;
  const clearIntervalFn = options.clearIntervalFn || clearInterval;

  await connectMongo(env.mongoUrl);
  const broker = await connectBroker(env.rabbitmqUrl, { logger });
  const topology = await declareTopology(broker.consumer);
  const owner = env.instanceId || `worker-${process.pid}`;
  let publishing = false;
  let lastCleanupAt = 0;
  const publish = async () => {
    if (publishing) return;
    publishing = true;
    try {
      await publishOutboxBatch({
        channel: broker.publisher,
        owner,
        leaseMs: 30_000,
        limit: 50,
      });
    } catch (error) {
      logger.error?.({ err: error }, "outbox publish failed");
    } finally {
      publishing = false;
    }
  };

  const tick = async () => {
    await publish();
    const now = Date.now();
    if (now - lastCleanupAt >= 24 * 60 * 60 * 1000) {
      try {
        await cleanupPublishedOutbox();
        lastCleanupAt = now;
      } catch (error) {
        logger.error?.({ err: error }, "outbox cleanup failed");
      }
    }
  };

  await tick();
  await consumeEvent({
    channel: broker.consumer,
    queue: topology.workQueue,
    store,
    handler: async (event) => {
      logger.info?.(
        { eventId: event.eventId, eventType: event.eventType },
        "domain event processed"
      );
    },
    retryExchange: topology.retryExchange,
    deadExchange: topology.deadExchange,
  });
  const timer = setIntervalFn(() => void tick(), 1000);
  timer.unref?.();

  let stopped = false;
  return {
    async stop() {
      if (stopped) return;
      stopped = true;
      clearIntervalFn(timer);
      await broker.close();
      await disconnectMongo();
    },
  };
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  startWorker()
    .then((runtime) => {
      process.once("SIGTERM", () => void runtime.stop());
      process.once("SIGINT", () => void runtime.stop());
    })
    .catch((error) => {
      console.error("MentorMe worker failed to start", error);
      process.exitCode = 1;
    });
}
