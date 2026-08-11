import { IsString, MaxLength, MinLength } from "class-validator";

export class MarkEarningPaidDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  payoutReference!: string;
}
