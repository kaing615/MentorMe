import { OmitType } from "@nestjs/swagger";
import { SignUpMentorDto } from "./sign-up-mentor.dto";

export class ApplyMentorDto extends OmitType(SignUpMentorDto, [
  "email",
  "password",
  "confirmPassword",
] as const) {}
