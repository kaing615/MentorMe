import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import type { ReviewTargetType } from "../review.schema";

export class ReviewQueryDto {
  @IsIn(["Course", "Mentor", "Booking"])
  targetType!: ReviewTargetType;

  @IsMongoId()
  target!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
