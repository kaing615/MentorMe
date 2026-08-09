import {
  assertOrderTransition,
  type OrderStatus,
} from "../../src/commerce/order-state";

const statuses: OrderStatus[] = [
  "pending",
  "processing",
  "paid",
  "completed",
  "failed",
  "cancelled",
  "refunded",
];

const allowed = new Set([
  "pending:processing",
  "pending:paid",
  "pending:cancelled",
  "pending:failed",
  "processing:paid",
  "processing:cancelled",
  "processing:failed",
  "paid:completed",
  "paid:refunded",
  "completed:refunded",
]);

describe("assertOrderTransition", () => {
  it("accepts only the order workflow transitions", () => {
    for (const from of statuses) {
      for (const to of statuses) {
        const transition = () => assertOrderTransition(from, to);
        if (allowed.has(`${from}:${to}`)) expect(transition).not.toThrow();
        else expect(transition).toThrow(`Cannot transition order from ${from} to ${to}`);
      }
    }
  });
});
