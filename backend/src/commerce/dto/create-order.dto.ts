import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

class DirectCourseDto {
  @IsMongoId()
  courseId!: string;
}

class BillingInfoDto {
  @IsEmail() email!: string;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() address?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectCourseDto)
  courses?: DirectCourseDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BillingInfoDto)
  billingInfo?: BillingInfoDto;

  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() discountCode?: string;
}
