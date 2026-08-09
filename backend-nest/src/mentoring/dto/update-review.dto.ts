import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rate?: number;
}
