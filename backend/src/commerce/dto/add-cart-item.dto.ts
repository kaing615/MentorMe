import { IsMongoId } from "class-validator";

export class AddCartItemDto {
  @IsMongoId()
  courseId!: string;
}
