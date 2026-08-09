import { IsIn, IsOptional, IsString } from "class-validator";

export const helpStatuses = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
] as const;

export class UpdateHelpRequestDto {
  @IsOptional()
  @IsIn(helpStatuses)
  status?: (typeof helpStatuses)[number];

  @IsOptional()
  @IsString()
  adminResponse?: string;
}
