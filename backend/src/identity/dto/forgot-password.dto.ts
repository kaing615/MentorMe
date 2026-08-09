import { Transform } from "class-transformer";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email!: string;
}
