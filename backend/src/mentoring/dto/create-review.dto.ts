import { IsIn, IsInt, IsMongoId, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import type { ReviewTargetType } from "../review.schema";

export class CreateReviewDto {
  @IsIn(["Course", "Mentor", "Booking"])
  targetType!: ReviewTargetType;

  @IsMongoId()
  target!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rate!: number;
}
