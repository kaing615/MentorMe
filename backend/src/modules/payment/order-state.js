const ORDER_TRANSITIONS = Object.freeze({
  pending: new Set(["processing", "failed", "cancelled"]),
  processing: new Set(["paid", "failed"]),
  paid: new Set(["completed", "refunded"]),
  completed: new Set(["refunded"]),
  failed: new Set(),
  cancelled: new Set(),
  refunded: new Set(),
});

export function assertOrderTransition(from, to) {
  if (!ORDER_TRANSITIONS[from]?.has(to)) {
    const error = new Error(`Order cannot transition from ${from} to ${to}`);
    error.code = "INVALID_ORDER_TRANSITION";
    throw error;
  }
  return true;
}

export function canTransitionOrder(from, to) {
  return Boolean(ORDER_TRANSITIONS[from]?.has(to));
}
