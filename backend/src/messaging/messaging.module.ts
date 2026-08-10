import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { EngagementModule } from "../engagement/engagement.module";
import { Message, MessageSchema } from "./message.schema";
import { MessagingController } from "./messaging.controller";
import { MessagingGateway } from "./messaging.gateway";
import { MessagingService } from "./messaging.service";

@Module({
  imports: [
    IdentityModule,
    EngagementModule,
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  controllers: [MessagingController],
  providers: [MessagingGateway, MessagingService],
  exports: [MessagingService, MongooseModule],
})
export class MessagingModule {}
