import { randomUUID } from "node:crypto";
import OutboxEvent from "./outbox.model.js";

export async function appendOutboxEvent(
  event,
  { session, model = OutboxEvent, clock = () => new Date() } = {}
) {
  const envelope = {
    eventId: event.eventId || randomUUID(),
    eventType: event.eventType,
    aggregateId: String(event.aggregateId),
    aggregateVersion: event.aggregateVersion,
    payloadVersion: event.payloadVersion || 1,
    payload: event.payload,
    occurredAt: event.occurredAt || clock(),
  };
  const [created] = await model.create([envelope], { session });
  return created;
}
