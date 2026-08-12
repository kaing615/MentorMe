import { IsString, MaxLength, MinLength } from "class-validator";

export class SuspendUserDto {
  @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}
