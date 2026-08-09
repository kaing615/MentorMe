import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateMentorProfileDto {
  @IsString() @MinLength(3) @MaxLength(30) userName!: string;
  @IsString() @MinLength(1) @MaxLength(50) firstName!: string;
  @IsString() @MinLength(1) @MaxLength(50) lastName!: string;
  @IsString() @MinLength(2) @MaxLength(100) jobTitle!: string;
  @IsString() @MinLength(1) category!: string;
  @IsString() @MinLength(50) @MaxLength(500) bio!: string;
  @IsString() @MinLength(20) @MaxLength(300) mentorReason!: string;
  @IsString() @MinLength(10) experience!: string;
  @IsArray() @IsString({ each: true }) skills!: string[];
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() greatestAchievement?: string;
  @IsOptional() @IsString() headline?: string;
  @IsOptional() @IsString() introVideo?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsString() timezone?: string;
}
