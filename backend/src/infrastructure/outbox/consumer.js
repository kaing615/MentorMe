export const RETRY_EXCHANGE = "mentorme.retry";
export const DEAD_EXCHANGE = "mentorme.dead";

function publishForLater({
  channel,
  exchange,
  routingKey,
  message,
  envelope,
  attempt,
  expiration,
  error,
}) {
  const headers = { "x-attempt": attempt };
  if (error) headers["x-error"] = error;
  const options = {
    persistent: true,
    contentType: "application/json",
    messageId: envelope.eventId,
    ...(expiration ? { expiration: String(expiration) } : {}),
    headers,
  };
  channel.publish(exchange, routingKey, message.content, options);
}

export async function handleDelivery({
  message,
  channel,
  store,
  handler,
  retryExchange = RETRY_EXCHANGE,
  deadExchange = DEAD_EXCHANGE,
  maxAttempts = 5,
  baseDelayMs = 1000,
}) {
  if (!message) return "empty";
  const currentAttempt = Number(message.properties.headers?.["x-attempt"] || 0);
  let envelope;
  try {
    envelope = JSON.parse(message.content.toString("utf8"));
    if (
      !envelope.eventId ||
      !envelope.eventType ||
      !envelope.aggregateId ||
      !Number.isInteger(envelope.aggregateVersion)
    ) {
      throw new Error("invalid envelope");
    }
  } catch {
    publishForLater({
      channel,
      exchange: deadExchange,
      routingKey: message.fields.routingKey || "invalid",
      message,
      envelope: { eventId: message.properties.messageId || "invalid" },
      attempt: currentAttempt + 1,
      error: "invalid event envelope",
    });
    channel.ack(message);
    return "dead-letter";
  }
  const routingKey = message.fields.routingKey || envelope.eventType;
  const claim = await store.begin(envelope);

  if (claim.outcome === "duplicate" || claim.outcome === "stale") {
    channel.ack(message);
    return claim.outcome;
  }

  if (claim.outcome === "gap") {
    const nextAttempt = currentAttempt + 1;
    if (nextAttempt >= maxAttempts) {
      publishForLater({
        channel,
        exchange: deadExchange,
        routingKey,
        message,
        envelope,
        attempt: nextAttempt,
        error: "aggregate version gap",
      });
      channel.ack(message);
      return "dead-letter";
    }
    publishForLater({
      channel,
      exchange: retryExchange,
      routingKey,
      message,
      envelope,
      attempt: nextAttempt,
      expiration: baseDelayMs * 2 ** currentAttempt,
    });
    channel.ack(message);
    return "retry";
  }

  try {
    await handler(envelope);
    await store.complete(envelope);
    channel.ack(message);
    return "processed";
  } catch (error) {
    await store.fail?.(envelope, error);
    const nextAttempt = currentAttempt + 1;
    const exhausted = nextAttempt >= maxAttempts;
    publishForLater({
      channel,
      exchange: exhausted ? deadExchange : retryExchange,
      routingKey,
      message,
      envelope,
      attempt: nextAttempt,
      expiration: exhausted ? undefined : baseDelayMs * 2 ** currentAttempt,
      error: exhausted ? error.message : undefined,
    });
    channel.ack(message);
    return exhausted ? "dead-letter" : "retry";
  }
}

export async function consumeEvent({ channel, queue, ...options }) {
  await channel.consume(
    queue,
    (message) => void handleDelivery({ message, channel, ...options }),
    { noAck: false }
  );
}
