import { IsIn, IsOptional, IsString } from "class-validator";
import type { OrderStatus } from "../order-state";

export class UpdateOrderStatusDto {
  @IsIn([
    "pending",
    "processing",
    "paid",
    "completed",
    "failed",
    "cancelled",
    "refunded",
  ])
  status!: OrderStatus;

  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() transactionId?: string;
}
