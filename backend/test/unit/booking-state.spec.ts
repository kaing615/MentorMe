import {
  assertBookingTransition,
  type BookingStatus,
} from "../../src/mentoring/booking-state";

const statuses: BookingStatus[] = [
  "pending",
  "active",
  "rejected",
  "finished",
  "cancelled",
];

const allowed = new Set([
  "pending:active",
  "pending:rejected",
  "pending:cancelled",
  "active:finished",
  "active:cancelled",
]);

describe("assertBookingTransition", () => {
  it("accepts only the booking workflow transitions", () => {
    for (const from of statuses) {
      for (const to of statuses) {
        const transition = () => assertBookingTransition(from, to);

        if (allowed.has(`${from}:${to}`)) {
          expect(transition).not.toThrow();
        } else {
          expect(transition).toThrow(`Cannot transition booking from ${from} to ${to}`);
        }
      }
    }
  });
});
