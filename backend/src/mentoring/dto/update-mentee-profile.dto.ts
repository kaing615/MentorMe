import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class ProfileLinksDto {
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() facebook?: string;
}

export class UpdateMenteeProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  userName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsString() education?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsString() timezone?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileLinksDto)
  links?: ProfileLinksDto;
}
