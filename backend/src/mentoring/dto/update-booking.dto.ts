import { IsOptional, IsString } from "class-validator";

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
