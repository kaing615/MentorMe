import { IsString } from "class-validator";

export class UpdateCartItemDto {
  @IsString()
  discountCode!: string;
}
