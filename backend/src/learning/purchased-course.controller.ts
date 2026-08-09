import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { AddPurchasedCourseReviewDto } from "./dto/add-purchased-course-review.dto";
import { GrantOrderDto } from "./dto/grant-order.dto";
import { UpdateProgressDto } from "./dto/update-progress.dto";
import { PurchasedCourseService } from "./purchased-course.service";

@Controller("purchased-courses")
@UseGuards(JwtAuthGuard)
export class PurchasedCourseController {
  constructor(private readonly purchases: PurchasedCourseService) {}

  @Get()
  list(@CurrentUser() user: UserDocument) {
    return this.purchases.list(user);
  }

  @Get("mentees")
  mentees(@CurrentUser() user: UserDocument) {
    return this.purchases.mentees(user);
  }

  @Get("check/:courseId")
  check(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
  ) {
    return this.purchases.check(user, courseId);
  }

  @Get("details/:purchasedCourseId")
  detail(
    @CurrentUser() user: UserDocument,
    @Param("purchasedCourseId") id: string,
  ) {
    return this.purchases.detail(user, id);
  }

  @Post("purchase-success")
  grant(@CurrentUser() user: UserDocument, @Body() dto: GrantOrderDto) {
    return this.purchases.grantOrder(user, dto.orderId);
  }

  @Patch(":purchasedCourseId/progress")
  progress(
    @CurrentUser() user: UserDocument,
    @Param("purchasedCourseId") id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.purchases.progress(user, id, dto);
  }

  @Post(":purchasedCourseId/review")
  @HttpCode(200)
  review(
    @CurrentUser() user: UserDocument,
    @Param("purchasedCourseId") id: string,
    @Body() dto: AddPurchasedCourseReviewDto,
  ) {
    return this.purchases.review(user, id, dto);
  }

  @Delete(":purchasedCourseId")
  remove(
    @CurrentUser() user: UserDocument,
    @Param("purchasedCourseId") id: string,
  ) {
    return this.purchases.remove(user, id);
  }
}
