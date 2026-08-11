import { IsOptional, IsUrl, MaxLength } from "class-validator";

export class ConfirmBookingDto {
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  meetingLink?: string;
}
