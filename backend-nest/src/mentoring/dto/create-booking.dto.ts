import { IsDateString, IsMongoId, IsOptional, IsString, Matches } from "class-validator";

export class CreateBookingDto {
  @IsDateString()
  date!: string;

  @Matches(/^\d{1,2}:\d{2}$/)
  start!: string;

  @Matches(/^\d{1,2}:\d{2}$/)
  end!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  relationship?: string;
}
