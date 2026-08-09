import { IsOptional, IsString } from "class-validator";

export class ConfirmManualPaymentDto {
  @IsString()
  orderNumber!: string;
  @IsOptional() @IsString() transactionId?: string;
  @IsOptional() @IsString() notes?: string;
}
