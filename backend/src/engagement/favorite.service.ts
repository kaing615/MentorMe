import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { Types } from "mongoose";
import { hasUserRole } from "../common/auth/user-role";
import { User, type UserDocument } from "../identity/user.schema";
import { Course } from "../learning/course.schema";

export type FavoriteType = "course" | "mentor";

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
  ) {}

  async list(user: UserDocument) {
    this.assertMentee(user);
    const owner = await this.users
      .findById(user._id)
      .select("favoriteCourses favoriteMentors")
      .lean();
    if (!owner) throw new NotFoundException("User not found");
    const [courses, mentors] = await Promise.all([
      this.courses
        .find({ _id: { $in: owner.favoriteCourses ?? [] } })
        .populate("mentor", "firstName lastName userName avatarUrl jobTitle")
        .select(
          "title description price thumbnail category rate numberOfRatings mentor",
        )
        .lean(),
      this.users
        .find({ _id: { $in: owner.favoriteMentors ?? [] } })
        .select(
          "firstName lastName userName avatarUrl jobTitle category skills bio role roles",
        )
        .lean(),
    ]);
    return { courses, mentors };
  }

  async add(user: UserDocument, type: string, id: string) {
    this.assertMentee(user);
    const targetType = this.type(type);
    const targetId = this.id(id);
    if (targetType === "course") {
      if (!(await this.courses.exists({ _id: targetId }))) {
        throw new NotFoundException("Course not found");
      }
    } else {
      if (String(user._id) === id) {
        throw new BadRequestException("You cannot favorite yourself");
      }
      if (
        !(await this.users.exists({
          _id: targetId,
          $or: [{ role: "mentor" }, { roles: "mentor" }],
        }))
      ) {
        throw new NotFoundException("Mentor not found");
      }
    }
    const field = targetType === "course" ? "favoriteCourses" : "favoriteMentors";
    await this.users.updateOne(
      { _id: user._id },
      { $addToSet: { [field]: targetId } },
    );
    return { type: targetType, id, isFavorite: true };
  }

  async remove(user: UserDocument, type: string, id: string) {
    this.assertMentee(user);
    const targetType = this.type(type);
    const targetId = this.id(id);
    const field = targetType === "course" ? "favoriteCourses" : "favoriteMentors";
    await this.users.updateOne({ _id: user._id }, { $pull: { [field]: targetId } });
    return { type: targetType, id, isFavorite: false };
  }

  private assertMentee(user: UserDocument): void {
    if (!hasUserRole(user, "mentee")) {
      throw new ForbiddenException("Only mentees can manage favorites");
    }
  }

  private type(value: string): FavoriteType {
    if (value !== "course" && value !== "mentor") {
      throw new BadRequestException("Favorite type must be course or mentor");
    }
    return value;
  }

  private id(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException("Invalid favorite ID");
    }
    return new Types.ObjectId(value);
  }
}
