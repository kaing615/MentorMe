import { Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { FavoriteService } from "./favorite.service";
import { NotificationService } from "./notification.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class EngagementController {
  constructor(
    private readonly favorites: FavoriteService,
    private readonly notifications: NotificationService,
  ) {}

  @Get("favorites")
  listFavorites(@CurrentUser() user: UserDocument) {
    return this.favorites.list(user);
  }

  @Post("favorites/:type/:id")
  @HttpCode(200)
  addFavorite(
    @CurrentUser() user: UserDocument,
    @Param("type") type: string,
    @Param("id") id: string,
  ) {
    return this.favorites.add(user, type, id);
  }

  @Delete("favorites/:type/:id")
  removeFavorite(
    @CurrentUser() user: UserDocument,
    @Param("type") type: string,
    @Param("id") id: string,
  ) {
    return this.favorites.remove(user, type, id);
  }

  @Get("notifications")
  listNotifications(
    @CurrentUser() user: UserDocument,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.notifications.list(user, page, limit);
  }

  @Patch("notifications/read-all")
  markAllNotificationsRead(@CurrentUser() user: UserDocument) {
    return this.notifications.markAllRead(user);
  }

  @Patch("notifications/:id/read")
  markNotificationRead(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
  ) {
    return this.notifications.markRead(user, id);
  }
}
