import amqp from "amqplib";

export async function connectBroker(url, { logger = console } = {}) {
  const connection = await amqp.connect(url);
  connection.on("error", (error) => logger.error?.({ err: error }, "RabbitMQ error"));
  connection.on("blocked", (reason) => logger.warn?.({ reason }, "RabbitMQ blocked"));
  const [publisher, consumer] = await Promise.all([
    connection.createConfirmChannel(),
    connection.createChannel(),
  ]);
  return {
    connection,
    publisher,
    consumer,
    async close() {
      await Promise.allSettled([publisher.close(), consumer.close()]);
      await connection.close();
    },
  };
}

export default connectBroker;
