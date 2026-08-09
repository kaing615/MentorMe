import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateCourseDto {
  @IsString() @MinLength(3) @MaxLength(100) title!: string;
  @IsOptional() @IsString() @MinLength(20) @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MinLength(20) @MaxLength(1000) courseOverview?: string;
  @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @IsString() @MinLength(2) @MaxLength(50) category!: string;
  @IsIn(["Beginner", "Intermediate", "Advanced", "Expert"])
  level!: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  @Type(() => Number) @IsInt() @Min(1) @Max(500) lectures!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) duration?: number;
  @IsOptional() @IsString() keyLearningObjectives?: string;
  @IsOptional() tags?: string | string[];
  @IsOptional() language?: string | string[];
  @IsOptional() @IsUrl() link?: string;
  @IsOptional() @IsUrl() driveLink?: string;
}
