import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { CourseService } from "./course.service";
import { AddContentDto } from "./dto/add-content.dto";
import { AddCourseReviewDto } from "./dto/add-course-review.dto";
import { AddMentorDto } from "./dto/add-mentor.dto";
import { CourseQueryDto } from "./dto/course-query.dto";
import { CreateCourseDto } from "./dto/create-course.dto";
import { ModerateCourseDto } from "./dto/moderate-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@Controller(["course", "courses"])
export class CourseController {
  constructor(private readonly courses: CourseService) {}

  @Get("related")
  related(
    @Query("courseId") courseId?: string,
    @Query("category") category?: string,
    @Query("limit") limit?: string,
  ) {
    return this.courses.related(courseId, category, limit);
  }

  @Get("mentor/:mentorId")
  byMentor(
    @Param("mentorId") mentorId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.courses.byMentor(
      mentorId,
      Math.max(Number(page) || 1, 1),
      Math.min(Math.max(Number(limit) || 10, 1), 100),
    );
  }

  @Get("reviews")
  allReviews(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sortBy") sortBy?: string,
  ) {
    return this.courses.allReviews(
      Math.max(Number(page) || 1, 1),
      Math.min(Math.max(Number(limit) || 10, 1), 100),
      sortBy,
    );
  }

  @Get()
  list(@Query() query: CourseQueryDto) {
    return this.courses.list(query);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard)
  adminList(
    @CurrentUser() user: UserDocument,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.courses.adminList(user, query);
  }

  @Patch("admin/:courseId/suspend")
  @UseGuards(JwtAuthGuard)
  suspend(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
    @Body() dto: ModerateCourseDto,
  ) {
    return this.courses.suspend(user, courseId, dto.reason);
  }

  @Patch("admin/:courseId/restore")
  @UseGuards(JwtAuthGuard)
  restore(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
  ) {
    return this.courses.restore(user, courseId);
  }

  @Get("my-courses")
  @UseGuards(JwtAuthGuard)
  own(@CurrentUser() user: UserDocument, @Query() query: CourseQueryDto) {
    return this.courses.own(user, query);
  }

  @Get(":courseId/purchase-status")
  @UseGuards(JwtAuthGuard)
  purchaseStatus(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
  ) {
    return this.courses.purchaseStatus(user, courseId);
  }

  @Get(":courseId")
  detail(@Param("courseId") courseId: string) {
    return this.courses.detail(courseId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("thumbnail"))
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.courses.create(user, dto, file);
  }

  @Put(":courseId")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("thumbnail"))
  update(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
    @Body() dto: UpdateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.courses.update(user, courseId, dto, file);
  }

  @Delete(":courseId")
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
  ) {
    return this.courses.remove(user, courseId);
  }

  @Post(":courseId/reviews")
  @UseGuards(JwtAuthGuard)
  addReview(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
    @Body() dto: AddCourseReviewDto,
  ) {
    return this.courses.addReview(user, courseId, dto);
  }

  @Get(":courseId/reviews")
  courseReviews(@Param("courseId") courseId: string) {
    return this.courses.courseReviews(courseId);
  }

  @Post(":courseId/mentors")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  addMentor(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
    @Body() dto: AddMentorDto,
  ) {
    return this.courses.addMentor(user, courseId, dto.mentorId);
  }

  @Delete(":courseId/mentors/:mentorId")
  @UseGuards(JwtAuthGuard)
  removeMentor(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
    @Param("mentorId") mentorId: string,
  ) {
    return this.courses.removeMentor(user, courseId, mentorId);
  }

  @Post(":courseId/content")
  @UseGuards(JwtAuthGuard)
  addContent(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
    @Body() dto: AddContentDto,
  ) {
    return this.courses.addContent(user, courseId, dto);
  }

  @Delete(":courseId/content/:contentId")
  @UseGuards(JwtAuthGuard)
  removeContent(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
    @Param("contentId") contentId: string,
  ) {
    return this.courses.removeContent(user, courseId, contentId);
  }
}
