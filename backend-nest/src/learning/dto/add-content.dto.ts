import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class AddContentDto {
  @IsString()
  title!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl() videoUrl?: string;
  @IsOptional() @IsUrl() documentUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) order?: number;
}
