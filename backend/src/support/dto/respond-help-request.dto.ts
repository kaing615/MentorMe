import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { helpStatuses } from "./update-help-request.dto";

export class RespondHelpRequestDto {
  @IsString() @MinLength(1) @MaxLength(5000) adminResponse!: string;
  @IsIn(helpStatuses) status!: (typeof helpStatuses)[number];
}
