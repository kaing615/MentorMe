import { createClient } from "redis";

export async function createRedisClients(
  url,
  { logger = console, onStateChange = () => {} } = {}
) {
  const command = createClient({
    url,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy(retries) {
        const jitter = Math.floor(Math.random() * 100);
        return Math.min(2 ** retries * 50, 3000) + jitter;
      },
    },
  });
  command.on("ready", () => onStateChange(true));
  command.on("end", () => onStateChange(false));
  command.on("error", (error) => {
    onStateChange(false);
    logger.error?.({ err: error }, "Redis error");
  });
  const publisher = command.duplicate();
  const subscriber = command.duplicate();
  publisher.on("error", (error) =>
    logger.error?.({ err: error }, "Redis publisher error")
  );
  subscriber.on("error", (error) =>
    logger.error?.({ err: error }, "Redis subscriber error")
  );
  try {
    await Promise.all([
      command.connect(),
      publisher.connect(),
      subscriber.connect(),
    ]);
  } catch (error) {
    await Promise.all(
      [subscriber, publisher, command].map((client) =>
        client.isOpen ? client.destroy() : Promise.resolve()
      )
    );
    throw error;
  }
  return {
    command,
    publisher,
    subscriber,
    async close() {
      await Promise.all(
        [subscriber, publisher, command].map((client) =>
          client.isOpen ? client.close() : Promise.resolve()
        )
      );
    },
  };
}
