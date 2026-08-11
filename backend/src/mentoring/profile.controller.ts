import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { AuthService } from "../identity/auth.service";
import type { UserDocument } from "../identity/user.schema";
import { UpdateMentorProfileDto } from "./dto/update-mentor-profile.dto";
import { UpdateMenteeProfileDto } from "./dto/update-mentee-profile.dto";
import { ProfileService } from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(
    private readonly profiles: ProfileService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getOwn(@CurrentUser() user: UserDocument) {
    return this.profiles.getOwn(user);
  }

  @Get("mentor/:mentorId")
  getMentor(@Param("mentorId") mentorId: string) {
    return this.profiles.getMentor(mentorId);
  }

  @Get("top-mentors")
  getTopMentors(@Query("limit") limit?: string) {
    return this.profiles.getTopMentors(limit);
  }

  @Get("mentors")
  getMentors(@Query() query: Record<string, string | undefined>) {
    return this.profiles.getMentors(query);
  }

  @Put("mentee")
  @UseGuards(JwtAuthGuard)
  updateMentee(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateMenteeProfileDto,
  ) {
    return this.profiles.updateMentee(user, dto);
  }

  @Put("mentor")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  updateMentor(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateMentorProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.profiles.updateMentor(user, dto, file);
  }

  @Put("avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  changeAvatar(
    @CurrentUser() user: UserDocument,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Chưa có file avatar gửi lên!");
    }
    return this.auth.changeAvatar(user, file);
  }
}
