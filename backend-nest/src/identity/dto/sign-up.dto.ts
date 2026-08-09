import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class SignUpDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/)
  userName!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  confirmPassword!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;
}
