import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { BookingService } from "./booking.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";

@Controller("booking")
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  @Post("mentor/:mentorId")
  @HttpCode(200)
  create(
    @CurrentUser() user: UserDocument,
    @Param("mentorId") mentorId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookings.create(user, mentorId, dto);
  }

  @Get()
  listAll(
    @CurrentUser() user: UserDocument,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.bookings.listAll(user, query);
  }

  @Get("mentor")
  listMentor(
    @CurrentUser() user: UserDocument,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.bookings.listForMentor(user, query);
  }

  @Get("mentee")
  listMentee(
    @CurrentUser() user: UserDocument,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.bookings.listForMentee(user, query);
  }

  @Post("confirm/:id")
  @HttpCode(200)
  confirm(@CurrentUser() user: UserDocument, @Param("id") id: string) {
    return this.bookings.confirm(user, id);
  }

  @Post("decline/:id")
  @HttpCode(200)
  decline(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body("reason") reason?: string,
  ) {
    return this.bookings.decline(user, id, reason);
  }

  @Post("cancel/:id")
  @HttpCode(200)
  cancel(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body("reason") reason?: string,
  ) {
    return this.bookings.cancel(user, id, reason);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookings.update(user, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: UserDocument, @Param("id") id: string) {
    return this.bookings.remove(user, id);
  }
}
