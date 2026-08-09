import { Transform } from "class-transformer";
import { IsEmail, IsString } from "class-validator";

export class VerifyEmailDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  verifyKey!: string;
}
