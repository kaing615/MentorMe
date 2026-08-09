import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import type { MessageType } from "./message.schema";

export class MessageAttachmentDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  type!: string;
}

export class SendMessageDto {
  @IsMongoId()
  receiver!: string;

  @IsOptional()
  @IsIn(["text", "image", "file"])
  messageType?: MessageType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];
}

export class MessageListQueryDto {
  @IsMongoId()
  peer!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export class MarkDeliveredDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  ids!: string[];
}

export class MarkReadDto {
  @IsMongoId()
  peerId!: string;
}
