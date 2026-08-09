import { Transform } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";
import { SignUpDto } from "./sign-up.dto";

const parseArray = (value: unknown): unknown => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
};

export class SignUpMentorDto extends SignUpDto {
  @IsString() @MinLength(2) @MaxLength(100) jobTitle!: string;
  @IsString() @MinLength(1) location!: string;
  @IsString() @MinLength(1) category!: string;
  @Transform(({ value }: { value: unknown }) => parseArray(value))
  @IsArray()
  @IsString({ each: true })
  skills!: string[];
  @IsString() @MinLength(50) @MaxLength(500) bio!: string;
  @IsString() @MinLength(20) @MaxLength(300) mentorReason!: string;
  @IsOptional() @IsString() greatestAchievement?: string;
  @IsUrl() linkedinUrl!: string;
  @IsOptional() @IsUrl() introVideo?: string;
}
