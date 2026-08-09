import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CourseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() mentor?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() rate?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() filterBy?: string;
}
