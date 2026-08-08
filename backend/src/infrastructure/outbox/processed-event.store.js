import ProcessedEvent from "./processed-event.model.js";

function mongoRepository(model, clock, retentionMs, leaseMs) {
  return {
    async findEvent(eventId) {
      return model.findOne({ eventId }).lean();
    },
    async latestVersion(aggregateId) {
      const latest = await model
        .findOne({ aggregateId, status: "completed" })
        .sort({ aggregateVersion: -1 })
        .select("aggregateVersion")
        .lean();
      return latest?.aggregateVersion || 0;
    },
    async acquire(envelope) {
      const now = clock();
      try {
        await model.create({
          eventId: envelope.eventId,
          aggregateId: envelope.aggregateId,
          aggregateVersion: envelope.aggregateVersion,
          eventType: envelope.eventType,
          status: "processing",
          leaseUntil: new Date(now.getTime() + leaseMs),
          expiresAt: new Date(now.getTime() + retentionMs),
        });
        return true;
      } catch (error) {
        if (error?.code !== 11000) throw error;
        const result = await model.updateOne(
          {
            eventId: envelope.eventId,
            status: "processing",
            leaseUntil: { $lte: now },
          },
          { $set: { leaseUntil: new Date(now.getTime() + leaseMs) } }
        );
        return result.modifiedCount === 1;
      }
    },
    async complete(envelope) {
      await model.updateOne(
        { eventId: envelope.eventId, status: "processing" },
        {
          $set: { status: "completed", processedAt: clock() },
          $unset: { leaseUntil: 1 },
        }
      );
    },
    async release(envelope) {
      await model.deleteOne({ eventId: envelope.eventId, status: "processing" });
    },
  };
}

export function createProcessedEventStore({
  repository,
  model = ProcessedEvent,
  clock = () => new Date(),
  retentionMs = 90 * 24 * 60 * 60 * 1000,
  leaseMs = 60_000,
} = {}) {
  const events = repository || mongoRepository(model, clock, retentionMs, leaseMs);
  return {
    async begin(envelope) {
      const existing = await events.findEvent(envelope.eventId);
      if (existing?.status === "completed") return { outcome: "duplicate" };

      const latestVersion = await events.latestVersion(envelope.aggregateId);
      if (envelope.aggregateVersion <= latestVersion) return { outcome: "stale" };
      if (envelope.aggregateVersion > latestVersion + 1) return { outcome: "gap" };

      const acquired = await events.acquire(envelope);
      return { outcome: acquired ? "acquired" : "gap" };
    },
    async complete(envelope) {
      await events.complete(envelope);
    },
    async fail(envelope) {
      await events.release(envelope);
    },
  };
}

export default createProcessedEventStore;
