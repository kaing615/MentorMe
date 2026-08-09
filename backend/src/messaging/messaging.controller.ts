import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import {
  MarkDeliveredDto,
  MarkReadDto,
  MessageListQueryDto,
  SendMessageDto,
} from "./messaging.dto";
import { MessagingService } from "./messaging.service";

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Post()
  send(@CurrentUser() user: UserDocument, @Body() dto: SendMessageDto) {
    return this.messaging.send(String(user._id), dto);
  }

  @Get()
  list(
    @CurrentUser() user: UserDocument,
    @Query() query: MessageListQueryDto,
  ) {
    return this.messaging.list(String(user._id), query);
  }

  @Post("mark-delivered")
  @HttpCode(200)
  async markDelivered(
    @CurrentUser() user: UserDocument,
    @Body() dto: MarkDeliveredDto,
  ) {
    const { matched, modified } = await this.messaging.markDelivered(
      String(user._id),
      dto,
    );
    return { matched, modified };
  }

  @Post("mark-read")
  @HttpCode(200)
  markRead(@CurrentUser() user: UserDocument, @Body() dto: MarkReadDto) {
    return this.messaging.markRead(String(user._id), dto);
  }

  @Get("conversations")
  conversations(@CurrentUser() user: UserDocument) {
    return this.messaging.conversations(String(user._id));
  }
}
