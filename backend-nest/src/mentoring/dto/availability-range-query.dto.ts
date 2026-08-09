import { IsDateString, IsOptional } from "class-validator";

export class AvailabilityRangeQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
