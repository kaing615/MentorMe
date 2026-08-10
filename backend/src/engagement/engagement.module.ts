import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { User, UserSchema } from "../identity/user.schema";
import { Course, CourseSchema } from "../learning/course.schema";
import { EngagementController } from "./engagement.controller";
import { FavoriteService } from "./favorite.service";
import { Notification, NotificationSchema } from "./notification.schema";
import { NotificationService } from "./notification.service";

@Module({
  imports: [
    IdentityModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [EngagementController],
  providers: [FavoriteService, NotificationService],
  exports: [NotificationService],
})
export class EngagementModule {}
