import OutboxEvent from "./outbox.model.js";

export async function cleanupPublishedOutbox({
  model = OutboxEvent,
  clock = () => new Date(),
  retentionMs = 30 * 24 * 60 * 60 * 1000,
} = {}) {
  const cutoff = new Date(clock().getTime() - retentionMs);
  const result = await model.deleteMany({
    status: "published",
    publishedAt: { $lt: cutoff },
  });
  return result.deletedCount || 0;
}

export default cleanupPublishedOutbox;
