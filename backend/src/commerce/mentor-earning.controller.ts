import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { MarkEarningPaidDto } from "./dto/mark-earning-paid.dto";
import { MentorEarningService } from "./mentor-earning.service";

@Controller("mentor-earnings")
@UseGuards(JwtAuthGuard)
export class MentorEarningController {
  constructor(private readonly earnings: MentorEarningService) {}

  @Get()
  mine(@CurrentUser() user: UserDocument) {
    return this.earnings.mine(user);
  }

  @Get("admin")
  all(@CurrentUser() user: UserDocument, @Query("status") status?: string) {
    return this.earnings.all(user, status);
  }

  @Patch("admin/:id/paid")
  markPaid(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body() dto: MarkEarningPaidDto,
  ) {
    return this.earnings.markPaid(user, id, dto);
  }
}
