import { IsString, Matches, MinLength } from "class-validator";

export class ChangeAdminPasswordDto {
  @IsString() currentPassword!: string;
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
  newPassword!: string;
}
