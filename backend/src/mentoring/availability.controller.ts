import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { AvailabilityService } from "./availability.service";
import { AvailabilityRangeQueryDto } from "./dto/availability-range-query.dto";
import { CreateAvailabilityDto } from "./dto/create-availability.dto";

@Controller("availability")
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Post()
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.availability.upsert(user, dto);
  }

  @Get("today-schedule")
  today(@CurrentUser() user: UserDocument, @Query("date") date?: string) {
    return this.availability.todaySchedule(user, date);
  }

  @Get("mentor/range")
  range(
    @CurrentUser() user: UserDocument,
    @Query() query: AvailabilityRangeQueryDto,
  ) {
    return this.availability.range(user, query);
  }

  @Get("overview")
  overview(@CurrentUser() user: UserDocument) {
    return this.availability.overview(user);
  }

  @Get("my-schedules")
  mySchedules(@CurrentUser() user: UserDocument) {
    return this.availability.mySchedules(user);
  }

  @Post("cleanup-old")
  @HttpCode(200)
  cleanup(
    @CurrentUser() user: UserDocument,
    @Body("daysBack") daysBack = 3,
  ) {
    if (user.role !== "admin") throw new ForbiddenException();
    return this.availability.deleteOlderThan(Number(daysBack));
  }

  @Get("mentor/:mentorId/public")
  publicAvailability(
    @Param("mentorId") mentorId: string,
    @Query() query: AvailabilityRangeQueryDto,
  ) {
    return this.availability.publicAvailability(mentorId, query);
  }

  @Delete(":availabilityId")
  remove(
    @CurrentUser() user: UserDocument,
    @Param("availabilityId") id: string,
  ) {
    return this.availability.remove(user, id);
  }
}
