import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export const issueCategories = [
  "Account Issues",
  "Booking Problems",
  "Payment Issues",
  "Technical Support",
  "Course Related",
  "Mentor Issues",
  "General Inquiry",
  "Bug Report",
  "Feature Request",
  "Other",
] as const;

export const priorityLevels = ["Low", "Medium", "High", "Urgent"] as const;

export class CreateHelpRequestDto {
  @IsString()
  @MaxLength(100)
  guestName!: string;

  @IsEmail()
  guestEmail!: string;

  @IsString()
  @MaxLength(200)
  subject!: string;

  @IsIn(issueCategories)
  issueCategory!: (typeof issueCategories)[number];

  @IsIn(priorityLevels)
  priorityLevel!: (typeof priorityLevels)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  issueDetails!: string;
}
