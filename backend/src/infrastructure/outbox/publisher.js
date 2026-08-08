import OutboxEvent from "./outbox.model.js";

export const EVENT_EXCHANGE = "mentorme.events";

function createRepository(model = OutboxEvent, clock = () => new Date()) {
  return {
    async claimBatch({ owner, leaseMs, limit }) {
      const claimed = [];
      for (let index = 0; index < limit; index += 1) {
        const now = clock();
        const event = await model.findOneAndUpdate(
          {
            $or: [
              { status: "pending" },
              { status: "leased", leaseUntil: { $lte: now } },
            ],
          },
          {
            $set: {
              status: "leased",
              leaseOwner: owner,
              leaseUntil: new Date(now.getTime() + leaseMs),
            },
            $inc: { attempts: 1 },
          },
          { new: true, sort: { occurredAt: 1 } }
        );
        if (!event) break;
        claimed.push(event);
      }
      return claimed;
    },
    async markPublished(eventId, owner) {
      await model.updateOne(
        { eventId, status: "leased", leaseOwner: owner },
        {
          $set: { status: "published", publishedAt: clock() },
          $unset: { leaseOwner: 1, leaseUntil: 1, lastError: 1 },
        }
      );
    },
    async release(eventId, error, owner) {
      await model.updateOne(
        { eventId, status: "leased", leaseOwner: owner },
        {
          $set: { status: "pending", lastError: error },
          $unset: { leaseOwner: 1, leaseUntil: 1 },
        }
      );
    },
  };
}

function publishConfirmed(channel, exchange, event) {
  const envelope = event.toObject ? event.toObject() : event;
  const content = Buffer.from(JSON.stringify(envelope));
  return new Promise((resolve, reject) => {
    channel.publish(
      exchange,
      envelope.eventType,
      content,
      {
        persistent: true,
        contentType: "application/json",
        messageId: envelope.eventId,
        type: envelope.eventType,
        timestamp: new Date(envelope.occurredAt).getTime(),
      },
      (error) => (error ? reject(error) : resolve())
    );
  });
}

export async function publishOutboxBatch({
  channel,
  repository = createRepository(),
  owner,
  leaseMs = 30_000,
  limit = 50,
  exchange = EVENT_EXCHANGE,
}) {
  const events = await repository.claimBatch({ owner, leaseMs, limit });
  let published = 0;
  let failed = 0;

  for (const event of events) {
    try {
      await publishConfirmed(channel, exchange, event);
      await repository.markPublished(event.eventId, owner);
      published += 1;
    } catch (error) {
      await repository.release(event.eventId, error.message, owner);
      failed += 1;
    }
  }

  return { claimed: events.length, published, failed };
}

export { createRepository as createOutboxRepository };
