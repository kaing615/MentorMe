import { IsMongoId } from "class-validator";

export class AddMentorDto {
  @IsMongoId()
  mentorId!: string;
}
