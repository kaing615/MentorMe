const BOOKING_TRANSITIONS = Object.freeze({
  pending: new Set(["active", "rejected", "cancelled"]),
  active: new Set(["finished", "cancelled"]),
  rejected: new Set(),
  finished: new Set(),
  cancelled: new Set(),
});

export function assertBookingTransition(from, to) {
  if (!BOOKING_TRANSITIONS[from]?.has(to)) {
    const error = new Error(`Booking cannot transition from ${from} to ${to}`);
    error.code = "INVALID_BOOKING_TRANSITION";
    throw error;
  }
  return true;
}

export function canTransitionBooking(from, to) {
  return Boolean(BOOKING_TRANSITIONS[from]?.has(to));
}

export function normalizeBookingDay(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error("Invalid booking date");
    error.code = "INVALID_BOOKING_DATE";
    throw error;
  }
  const dateKey = parsed.toISOString().slice(0, 10);
  return new Date(`${dateKey}T00:00:00.000Z`);
}
