import { BadRequestException } from "@nestjs/common";

export type BookingStatus =
  | "pending"
  | "active"
  | "rejected"
  | "finished"
  | "cancelled";

const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["active", "rejected", "cancelled"],
  active: ["finished", "cancelled"],
  rejected: [],
  finished: [],
  cancelled: [],
};

export function assertBookingTransition(
  from: BookingStatus,
  to: BookingStatus,
): void {
  if (!transitions[from].includes(to)) {
    throw new BadRequestException(
      `Cannot transition booking from ${from} to ${to}`,
    );
  }
}
