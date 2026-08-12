import { IsString, MaxLength, MinLength } from "class-validator";

export class ModerateCourseDto {
  @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}
