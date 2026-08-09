import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

class AvailabilitySlotDto {
  @Matches(/^\d{1,2}:\d{2}$/)
  start!: string;

  @Matches(/^\d{1,2}:\d{2}$/)
  end!: string;

  @IsOptional()
  @IsIn(["open", "blocked"])
  status?: "open" | "blocked";
}

export class CreateAvailabilityDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];
}
