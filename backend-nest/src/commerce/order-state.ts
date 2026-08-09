import { BadRequestException } from "@nestjs/common";

export type OrderStatus =
  | "pending"
  | "processing"
  | "paid"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "paid", "cancelled", "failed"],
  processing: ["paid", "cancelled", "failed"],
  paid: ["completed", "refunded"],
  completed: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!transitions[from].includes(to)) {
    throw new BadRequestException(`Cannot transition order from ${from} to ${to}`);
  }
}
