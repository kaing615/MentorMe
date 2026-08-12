import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class AdminUserQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(["mentor", "mentee", "admin"]) role?: "mentor" | "mentee" | "admin";
  @IsOptional() @Type(() => Boolean) @IsBoolean() verified?: boolean;
  @IsOptional() @Type(() => Boolean) @IsBoolean() suspended?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
