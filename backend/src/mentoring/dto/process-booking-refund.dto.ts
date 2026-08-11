import { IsString, MaxLength, MinLength } from "class-validator";

export class ProcessBookingRefundDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  refundReference!: string;
}
