import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
