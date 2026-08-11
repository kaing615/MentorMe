import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewMentorApplicationDto {
  @IsIn(["approved", "rejected"])
  status!: "approved" | "rejected";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
