import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateAdminProfileDto {
  @IsString() @MinLength(1) @MaxLength(50) firstName!: string;
  @IsString() @MinLength(1) @MaxLength(50) lastName!: string;
}
