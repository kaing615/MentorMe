import { IsMongoId } from "class-validator";

export class GrantOrderDto {
  @IsMongoId()
  orderId!: string;
}
