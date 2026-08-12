import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import { User } from "../identity/user.schema";
import type { UserDocument } from "../identity/user.schema";
import { hasUserRole } from "../common/auth/user-role";
import { CloudinaryService } from "../infrastructure/files/cloudinary.service";
import type { UpdateMentorProfileDto } from "./dto/update-mentor-profile.dto";
import type { UpdateMenteeProfileDto } from "./dto/update-mentee-profile.dto";
import { Profile } from "./profile.schema";

@Injectable()
export class ProfileService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Profile.name) private readonly profiles: Model<Profile>,
    private readonly files: CloudinaryService,
  ) {}

  async getOwn(user: UserDocument) {
    const profile = await this.findOrCreate(user);
    return this.response(user, profile);
  }

  async getMentor(mentorId: string) {
    const user = await this.users.findById(mentorId);
    if (!user) throw new BadRequestException("Mentor không tồn tại");
    if (user.role !== "mentor") {
      throw new BadRequestException("User này không phải là mentor");
    }
    const profile = await this.findOrCreate(user);
    return {
      ...this.response(user, profile),
      totalMentees: await this.totalMentees(user._id),
    };
  }

  async getTopMentors(limitValue?: string) {
    const limit = Math.min(Math.max(Number(limitValue) || 6, 1), 50);
    const users = await this.users
      .find({ role: "mentor", isVerified: true })
      .limit(limit);
    const mentors = await Promise.all(
      users.map(async (user) => {
        const profile = await this.findOrCreate(user);
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          jobTitle: profile.jobTitle || user.jobTitle || "",
          category: profile.category || user.category || "",
          avatarUrl: user.avatarUrl || "",
          bio: profile.bio || user.bio || "",
          skills: profile.skills || [],
          averageRating: profile.rate || 0,
          totalReviews: profile.reviews?.length || 0,
          totalStudents: await this.totalMentees(user._id),
          sessionPrice: profile.sessionPrice || 0,
        };
      }),
    );
    return { mentors, total: mentors.length };
  }

  async getMentors(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 50);
    const users = await this.users.find({ role: "mentor", isVerified: true });
    const profiles = await this.profiles.find({
      user: { $in: users.map(({ _id }) => _id) },
    });
    const profileByUser = new Map(
      profiles.map((profile) => [String(profile.user), profile]),
    );

    let mentors = await Promise.all(
      users.map(async (user) => {
        const profile = profileByUser.get(String(user._id));
        const skills = profile?.skills?.length ? profile.skills : user.skills || [];
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          jobTitle: profile?.jobTitle || user.jobTitle || "",
          category: profile?.category || user.category || "",
          avatarUrl: user.avatarUrl || "",
          bio: profile?.bio || user.bio || "",
          skills,
          averageRating: profile?.rate || 0,
          totalReviews: profile?.reviews?.length || 0,
          totalStudents: await this.totalMentees(user._id),
          sessionPrice: profile?.sessionPrice || 0,
        };
      }),
    );

    const search = query.search?.trim().toLowerCase();
    if (search) {
      mentors = mentors.filter((mentor) =>
        [
          mentor.fullName,
          mentor.jobTitle,
          mentor.category,
          mentor.bio,
          ...mentor.skills,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }
    const selectedSkills = query.skills
      ?.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (selectedSkills?.length) {
      mentors = mentors.filter((mentor) =>
        selectedSkills.some((selected) =>
          mentor.skills.some((skill) => skill.toLowerCase() === selected),
        ),
      );
    }
    const jobTitles = query.jobTitles
      ?.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (jobTitles?.length) {
      mentors = mentors.filter((mentor) =>
        jobTitles.some((title) => mentor.jobTitle.toLowerCase().includes(title)),
      );
    }
    const minRating = Number(query.minRating);
    if (Number.isFinite(minRating) && minRating > 0) {
      mentors = mentors.filter(({ averageRating }) => averageRating >= minRating);
    }
    if (query.category) {
      const category = query.category.toLowerCase();
      mentors = mentors.filter((mentor) =>
        mentor.category.toLowerCase().includes(category),
      );
    }
    if (query.sort === "rating") {
      mentors.sort((left, right) => right.averageRating - left.averageRating);
    } else if (query.sort === "students") {
      mentors.sort((left, right) => right.totalStudents - left.totalStudents);
    }

    const facets = {
      skills: [...new Set(mentors.flatMap(({ skills }) => skills))].sort(),
      jobTitles: [...new Set(mentors.map(({ jobTitle }) => jobTitle).filter(Boolean))].sort(),
    };
    const total = mentors.length;
    const start = (page - 1) * limit;
    return {
      mentors: mentors.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      facets,
    };
  }

  async updateMentee(user: UserDocument, dto: UpdateMenteeProfileDto) {
    if (!hasUserRole(user, "mentee")) {
      throw new ForbiddenException(
        "Chỉ mentee mới có thể cập nhật thông tin này",
      );
    }
    user.userName = dto.userName;
    user.firstName = this.capitalize(dto.firstName);
    user.lastName = this.capitalize(dto.lastName);
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.location !== undefined) user.location = dto.location;
    await user.save();

    const profile = await this.findOrCreate(user);
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.location !== undefined) profile.location = dto.location;
    if (dto.description !== undefined) profile.description = dto.description;
    if (dto.goal !== undefined) profile.goal = dto.goal;
    if (dto.education !== undefined) profile.education = dto.education;
    if (dto.languages !== undefined) profile.languages = dto.languages;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone;
    if (dto.links?.website !== undefined) profile.links.website = dto.links.website;
    if (dto.links?.twitter !== undefined) profile.links.twitter = dto.links.twitter;
    if (dto.links?.linkedin !== undefined) profile.links.linkedin = dto.links.linkedin;
    if (dto.links?.facebook !== undefined) profile.links.facebook = dto.links.facebook;
    await profile.save();

    return {
      message: "Cập nhật thông tin mentee thành công!",
      user: this.sanitizeUser(user),
      profile,
    };
  }

  async updateMentor(
    user: UserDocument,
    dto: UpdateMentorProfileDto,
    file?: Express.Multer.File,
  ) {
    if (!hasUserRole(user, "mentor")) {
      throw new ForbiddenException(
        "Chỉ mentor mới có thể cập nhật thông tin này",
      );
    }
    if (file) {
      if (user.avatarPublicId) await this.files.delete(user.avatarPublicId);
      const uploaded = await this.files.uploadAvatar(file, String(user._id));
      user.avatarUrl = uploaded.url;
      user.avatarPublicId = uploaded.publicId;
    }
    user.userName = dto.userName;
    user.firstName = this.capitalize(dto.firstName);
    user.lastName = this.capitalize(dto.lastName);
    user.jobTitle = dto.jobTitle;
    user.category = dto.category;
    user.bio = dto.bio;
    user.mentorReason = dto.mentorReason;
    user.skills = dto.skills;
    if (dto.location !== undefined) user.location = dto.location;
    if (dto.greatestAchievement !== undefined) {
      user.greatestAchievement = dto.greatestAchievement;
    }
    if (dto.introVideo !== undefined) user.introVideo = dto.introVideo;
    await user.save();

    const profile = await this.findOrCreate(user);
    profile.jobTitle = dto.jobTitle;
    profile.category = dto.category;
    profile.bio = dto.bio;
    profile.mentorReason = dto.mentorReason;
    profile.experience = dto.experience;
    profile.skills = dto.skills;
    if (dto.location !== undefined) profile.location = dto.location;
    if (dto.greatestAchievement !== undefined) {
      profile.greatestAchievement = dto.greatestAchievement;
    }
    if (dto.headline !== undefined) profile.headline = dto.headline;
    if (dto.introVideo !== undefined) profile.introVideo = dto.introVideo;
    if (dto.languages !== undefined) profile.languages = dto.languages;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone;
    if (dto.sessionPrice !== undefined) profile.sessionPrice = dto.sessionPrice;
    if (dto.links) Object.assign(profile.links, dto.links);
    await profile.save();

    return {
      message: "Cập nhật thông tin mentor thành công!",
      user: this.sanitizeUser(user),
      profile,
    };
  }

  private async findOrCreate(user: UserDocument) {
    return this.profiles.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          jobTitle: user.jobTitle || "",
          location: user.location || "",
          category: user.category || "",
          bio: user.bio || "",
          skills: user.skills || [],
          mentorReason: user.mentorReason || "",
          greatestAchievement: user.greatestAchievement || "",
          introVideo: user.introVideo || "",
          links: { linkedin: user.linkedinUrl || "" },
        },
      },
      { new: true, upsert: true },
    );
  }

  private async totalMentees(mentorId: unknown): Promise<number> {
    const [bookingMentees, courseMentees] = (await Promise.all([
      this.connection.collection("bookings").distinct("mentee", {
        mentor: mentorId,
        status: { $in: ["active", "finished"] },
      }),
      this.connection.collection("courses").distinct("mentees", {
        mentor: mentorId,
      }),
    ])) as [unknown[], unknown[]];
    return new Set([...bookingMentees, ...courseMentees].map(String)).size;
  }

  private response(user: UserDocument, profile: Profile) {
    return {
      profile: {
        _id: user._id,
        email: user.email,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        avatarPublicId: user.avatarPublicId,
        isVerified: user.isVerified,
        jobTitle: profile.jobTitle || user.jobTitle || "",
        location: profile.location || user.location || "",
        category: profile.category || user.category || "",
        bio: profile.bio || user.bio || "",
        skills: profile.skills.length ? profile.skills : user.skills || [],
        experience: profile.experience,
        headline: profile.headline,
        mentorReason: profile.mentorReason || user.mentorReason || "",
        greatestAchievement:
          profile.greatestAchievement || user.greatestAchievement || "",
        introVideo: profile.introVideo || user.introVideo || "",
        description: profile.description,
        goal: profile.goal,
        education: profile.education,
        languages: profile.languages,
        timezone: profile.timezone,
        links: profile.links,
        reviews: profile.reviews,
        rate: profile.rate,
        sessionPrice: profile.sessionPrice,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      user: { ...this.sanitizeUser(user), experience: profile.experience },
    };
  }

  private sanitizeUser(user: UserDocument): Record<string, unknown> {
    const safe = { ...user.toObject() } as Record<string, unknown>;
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

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
