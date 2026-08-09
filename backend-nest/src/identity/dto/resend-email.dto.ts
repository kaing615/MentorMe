import { Transform } from "class-transformer";
import { IsEmail } from "class-validator";

export class ResendEmailDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email!: string;
}
