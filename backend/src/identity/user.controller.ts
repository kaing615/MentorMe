import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { ApplyMentorDto } from "./dto/apply-mentor.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResendEmailDto } from "./dto/resend-email.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ReviewMentorApplicationDto } from "./dto/review-mentor-application.dto";
import type { MentorApplicationStatus } from "./mentor-application.schema";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpMentorDto } from "./dto/sign-up-mentor.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import type { UserDocument } from "./user.schema";

@Controller("user")
export class UserController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  signUp(@Body() dto: SignUpDto) {
    return this.auth.signUp(dto);
  }

  @Post("signin")
  @HttpCode(200)
  signIn(@Body() dto: SignInDto) {
    return this.auth.signIn(dto);
  }

  @Post("forgot-password")
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Get("verify")
  verifyEmail(@Query() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Post("resend-email")
  @HttpCode(200)
  resendEmail(@Body() dto: ResendEmailDto) {
    return this.auth.resendVerification(dto);
  }

  @Post("reset-password")
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post("signupMentor")
  @UseInterceptors(FileInterceptor("avatar"))
  signUpMentor(
    @Body() dto: SignUpMentorDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Avatar là bắt buộc");
    return this.auth.signUpMentor(dto, file);
  }

  @Post("applyMentor")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  applyMentor(
    @CurrentUser() user: UserDocument,
    @Body() dto: ApplyMentorDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.auth.applyAsMentor(user, dto, file);
  }

  @Get("mentor-application")
  @UseGuards(JwtAuthGuard)
  mentorApplication(@CurrentUser() user: UserDocument) {
    return this.auth.getMentorApplication(user);
  }

  @Get("admin/mentor-applications")
  @UseGuards(JwtAuthGuard)
  mentorApplications(
    @CurrentUser() user: UserDocument,
    @Query("status") status?: MentorApplicationStatus,
  ) {
    return this.auth.listMentorApplications(user, status);
  }

  @Patch("admin/mentor-applications/:id")
  @UseGuards(JwtAuthGuard)
  reviewMentorApplication(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body() dto: ReviewMentorApplicationDto,
  ) {
    return this.auth.reviewMentorApplication(user, id, dto);
  }

  @Post("avatar")
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
