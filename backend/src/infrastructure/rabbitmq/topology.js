export const TOPOLOGY = Object.freeze({
  eventExchange: "mentorme.events",
  retryExchange: "mentorme.retry",
  deadExchange: "mentorme.dead",
  workQueue: "mentorme.domain-events",
  retryQueue: "mentorme.domain-events.retry",
  deadQueue: "mentorme.domain-events.dead",
});

export async function declareTopology(channel, { prefetch = 20 } = {}) {
  await channel.assertExchange(TOPOLOGY.eventExchange, "topic", { durable: true });
  await channel.assertExchange(TOPOLOGY.retryExchange, "topic", { durable: true });
  await channel.assertExchange(TOPOLOGY.deadExchange, "topic", { durable: true });

  await channel.assertQueue(TOPOLOGY.workQueue, { durable: true });
  await channel.assertQueue(TOPOLOGY.retryQueue, {
    durable: true,
    arguments: { "x-dead-letter-exchange": TOPOLOGY.eventExchange },
  });
  await channel.assertQueue(TOPOLOGY.deadQueue, { durable: true });

  await channel.bindQueue(TOPOLOGY.workQueue, TOPOLOGY.eventExchange, "#");
  await channel.bindQueue(TOPOLOGY.retryQueue, TOPOLOGY.retryExchange, "#");
  await channel.bindQueue(TOPOLOGY.deadQueue, TOPOLOGY.deadExchange, "#");
  await channel.prefetch(prefetch);
  return TOPOLOGY;
}

export default declareTopology;
