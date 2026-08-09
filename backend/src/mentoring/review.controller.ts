import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewQueryDto } from "./dto/review-query.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { ReviewService } from "./review.service";

@Controller("reviews")
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Post()
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateReviewDto | CreateReviewDto[],
  ) {
    return this.reviews.create(user, dto);
  }

  @Get()
  list(@Query() query: ReviewQueryDto) {
    return this.reviews.list(query);
  }

  @Get("my")
  own(
    @CurrentUser() user: UserDocument,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("targetType") targetType?: string,
  ) {
    return this.reviews.listOwn(user, page, limit, targetType);
  }

  @Get("booking/:mentorId")
  booking(
    @Param("mentorId") mentorId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reviews.listBookingReviews(mentorId, page, limit);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviews.update(user, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: UserDocument, @Param("id") id: string) {
    return this.reviews.remove(user, id);
  }
}
