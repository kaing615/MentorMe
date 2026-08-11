import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { Model } from "mongoose";
import { Types } from "mongoose";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { ApplyMentorDto } from "./dto/apply-mentor.dto";
import type { ResendEmailDto } from "./dto/resend-email.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { ReviewMentorApplicationDto } from "./dto/review-mentor-application.dto";
import type { SignInDto } from "./dto/sign-in.dto";
import type { SignUpMentorDto } from "./dto/sign-up-mentor.dto";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { VerifyEmailDto } from "./dto/verify-email.dto";
import { EmailService } from "../infrastructure/email/email.service";
import { CloudinaryService } from "../infrastructure/files/cloudinary.service";
import { User } from "./user.schema";
import type { UserDocument } from "./user.schema";
import {
  MentorApplication,
  type MentorApplicationStatus,
} from "./mentor-application.schema";

const genericResetMessage =
  "Nếu email này tồn tại, đã gửi liên kết đặt lại mật khẩu.";

type LegacyJwtPayload = {
  id?: string;
  sub?: string;
  data?: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(MentorApplication.name)
    private readonly mentorApplications: Model<MentorApplication>,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly files: CloudinaryService,
  ) {}

  async signUp(dto: SignUpDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException(
        "Mật khẩu và xác nhận mật khẩu không khớp.",
      );
    }
    if (await this.users.exists({ email: dto.email })) {
      throw new BadRequestException("Email đã được sử dụng.");
    }

    const isTest = process.env.NODE_ENV === "test";
    const values: Record<string, unknown> = {
      email: dto.email,
      userName: dto.userName,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: await bcrypt.hash(dto.password, 10),
      role: "mentee",
      roles: ["mentee"],
      isVerified: isTest,
      verifyKey: isTest ? "" : crypto.randomBytes(32).toString("hex"),
    };
    if (!isTest) {
      values.verifyKeyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    const user = await this.users.create(values);

    if (isTest) {
      return {
        message: "Đăng ký thành công! Tài khoản đã được kích hoạt.",
        token: await this.signToken(user),
        user: this.sanitize(user.toObject()),
      };
    }
    await this.email.sendVerification(
      user.email,
      user.verifyKey ?? "",
      user.userName,
    );
    return {
      message:
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
      id: user._id,
    };
  }

  async signIn(dto: SignInDto) {
    const user = await this.users.findOne({ email: dto.email });
    const dummyHash =
      "$2a$10$ull7LxLFMg9MvAgkKYlWBuQ3yA57nLCbSAT6BPhEqMacBVDOa2Jby";
    const valid = await bcrypt.compare(dto.password, user?.password ?? dummyHash);
    if (!user?.isVerified || !valid) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng.");
    }
    return {
      token: await this.signToken(user),
      user: this.sanitize(user.toObject()),
    };
  }

  async authenticateToken(token: string): Promise<UserDocument> {
    try {
      const payload = await this.jwt.verifyAsync<LegacyJwtPayload>(token);
      const userId = payload.id ?? payload.sub ?? payload.data;
      if (!userId) throw new UnauthorizedException();
      const user = await this.users.findById(userId).select("-password -__v");
      if (!user?.isVerified) throw new UnauthorizedException();
      return user;
    } catch {
      throw new UnauthorizedException();
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findOne({ email: dto.email });
    if (user) {
      user.resetToken = crypto.randomBytes(32).toString("hex");
      user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      await this.email.sendPasswordReset(user.email, user.resetToken);
    }
    return { message: genericResetMessage };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.users.findOne({
      email: dto.email,
      verifyKey: dto.verifyKey,
      isVerified: false,
      verifyKeyExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new BadRequestException(
        "Liên kết xác thực không hợp lệ hoặc đã được sử dụng.",
      );
    }
    user.isVerified = true;
    user.verifyKey = "";
    user.set("verifyKeyExpires", undefined);
    await user.save();
    return {
      message: "Xác thực email thành công!",
      token: await this.signToken(user),
      ...this.sanitize(user.toObject()),
      id: user._id,
    };
  }

  async resendVerification(dto: ResendEmailDto) {
    const user = await this.users.findOne({
      email: dto.email,
      isVerified: false,
    });
    if (!user) {
      throw new BadRequestException("Người dùng đã xác thực hoặc không tồn tại.");
    }
    user.verifyKey = crypto.randomBytes(32).toString("hex");
    user.verifyKeyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    await this.email.sendVerification(user.email, user.verifyKey, user.userName);
    return { message: "Đã gửi lại email xác thực thành công!" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.users.findOne({
      email: dto.email,
      resetToken: dto.token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new BadRequestException(
        "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
      );
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.set("resetToken", undefined);
    user.set("resetTokenExpires", undefined);
    await user.save();
    return { message: "Đặt lại mật khẩu thành công." };
  }

  async signUpMentor(dto: SignUpMentorDto, file: Express.Multer.File) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException(
        "Mật khẩu và xác nhận mật khẩu không khớp.",
      );
    }
    if (await this.users.exists({ email: dto.email })) {
      throw new BadRequestException("Email đã được sử dụng.");
    }
    const user = new this.users({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
      role: "mentee",
      roles: ["mentee"],
      isVerified: process.env.NODE_ENV === "test",
    });
    const uploaded = await this.files.uploadAvatar(file, String(user._id));
    user.avatarUrl = uploaded.url;
    user.avatarPublicId = uploaded.publicId;
    await user.save();
    const application = await this.submitMentorApplication(user);
    return {
      message: "Hồ sơ mentor đã được gửi để xét duyệt.",
      token: await this.signToken(user),
      user: this.sanitize(user.toObject()),
      application,
      id: user._id,
      avatarUrl: user.avatarUrl,
    };
  }

  async applyAsMentor(
    user: UserDocument,
    dto: ApplyMentorDto,
    file?: Express.Multer.File,
  ) {
    if (user.role !== "mentee") {
      throw new BadRequestException("Chỉ mentee mới có thể đăng ký làm mentor.");
    }
    if (!file && !user.avatarUrl) {
      throw new BadRequestException("Avatar là bắt buộc");
    }
    if (file) {
      if (user.avatarPublicId) await this.files.delete(user.avatarPublicId);
      const uploaded = await this.files.uploadAvatar(file, String(user._id));
      user.avatarUrl = uploaded.url;
      user.avatarPublicId = uploaded.publicId;
    }
    user.userName = dto.userName;
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.jobTitle = dto.jobTitle;
    user.location = dto.location;
    user.category = dto.category;
    user.skills = dto.skills;
    user.bio = dto.bio;
    user.linkedinUrl = dto.linkedinUrl;
    user.mentorReason = dto.mentorReason;
    if (dto.introVideo !== undefined) user.introVideo = dto.introVideo;
    if (dto.greatestAchievement !== undefined) {
      user.greatestAchievement = dto.greatestAchievement;
    }
    await user.save();
    const application = await this.submitMentorApplication(user);
    return {
      message: "Hồ sơ mentor đã được gửi để xét duyệt.",
      token: await this.signToken(user),
      user: this.sanitize(user.toObject()),
      application,
      avatarUrl: user.avatarUrl,
    };
  }

  async getMentorApplication(user: UserDocument) {
    return {
      application: await this.mentorApplications.findOne({ user: user._id }),
    };
  }

  async listMentorApplications(
    user: UserDocument,
    status?: MentorApplicationStatus,
  ) {
    this.requireAdmin(user);
    const filter = status ? { status } : {};
    const applications = await this.mentorApplications
      .find(filter)
      .sort({ createdAt: -1 })
      .populate(
        "user",
        "firstName lastName userName email avatarUrl jobTitle location category skills bio linkedinUrl mentorReason greatestAchievement introVideo role roles",
      );
    return { applications, total: applications.length };
  }

  async reviewMentorApplication(
    admin: UserDocument,
    id: string,
    dto: ReviewMentorApplicationDto,
  ) {
    this.requireAdmin(admin);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid mentor application ID");
    }
    const application = await this.mentorApplications.findById(id);
    if (!application) throw new NotFoundException("Mentor application not found");
    if (application.status !== "pending") {
      throw new BadRequestException("Mentor application has already been reviewed");
    }
    const applicant = await this.users.findById(application.user);
    if (!applicant) throw new NotFoundException("Applicant not found");

    application.status = dto.status;
    application.reviewReason = dto.reason?.trim() ?? "";
    application.reviewedAt = new Date();
    application.reviewedBy = admin._id;
    if (dto.status === "approved") {
      applicant.roles = [
        ...new Set([
          ...(applicant.roles?.length
            ? applicant.roles
            : applicant.role
              ? [applicant.role]
              : []),
          "mentor" as const,
        ]),
      ];
      applicant.role = "mentor";
      await applicant.save();
    }
    await application.save();
    return {
      application,
      user: this.sanitize(applicant.toObject()),
    };
  }

  private async submitMentorApplication(user: UserDocument) {
    const existing = await this.mentorApplications.findOne({ user: user._id });
    if (existing?.status === "pending") {
      throw new BadRequestException("Hồ sơ mentor đang chờ xét duyệt.");
    }
    if (existing?.status === "approved") {
      throw new BadRequestException("Tài khoản đã được duyệt làm mentor.");
    }
    return this.mentorApplications.findOneAndUpdate(
      { user: user._id },
      {
        $set: { status: "pending", reviewReason: "" },
        $unset: { reviewedAt: "", reviewedBy: "" },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  private requireAdmin(user: UserDocument): void {
    if (user.role !== "admin") throw new ForbiddenException("Admin only");
  }

  async changeAvatar(user: UserDocument, file: Express.Multer.File) {
    if (user.avatarPublicId) await this.files.delete(user.avatarPublicId);
    const uploaded = await this.files.uploadAvatar(file, String(user._id));
    user.avatarUrl = uploaded.url;
    user.avatarPublicId = uploaded.publicId;
    await user.save();
    return { message: "Đổi avatar thành công!", avatarUrl: user.avatarUrl };
  }

  private signToken(user: UserDocument): Promise<string> {
    const id = String(user._id);
    return this.jwt.signAsync(
      { id, role: user.role, userName: user.userName, email: user.email },
      { expiresIn: "7d" },
    );
  }

  private sanitize(source: object): Record<string, unknown> {
    const safe = { ...source } as Record<string, unknown>;
    for (const key of [
      "password",
      "verifyKey",
      "verifyKeyExpires",
      "resetToken",
      "resetTokenExpires",
      "__v",
    ]) {
      Reflect.deleteProperty(safe, key);
    }
    return safe;
  }
}
