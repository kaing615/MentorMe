import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import { Types } from "mongoose";
import sanitizeHtml from "sanitize-html";
import type { UserDocument } from "../identity/user.schema";
import { Booking } from "./booking.schema";
import type { CreateReviewDto } from "./dto/create-review.dto";
import type { ReviewQueryDto } from "./dto/review-query.dto";
import type { UpdateReviewDto } from "./dto/update-review.dto";
import { Review, type ReviewDocument, type ReviewTargetType } from "./review.schema";

type CourseRecord = {
  _id: Types.ObjectId;
  title?: string;
  thumbnail?: string;
  mentor?: Types.ObjectId;
  mentees?: Types.ObjectId[];
};

type UserRecord = {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  skills?: string[];
};

type BookingRecord = {
  _id: Types.ObjectId;
  mentor: Types.ObjectId;
  mentee: Types.ObjectId;
  date?: Date;
  start?: string;
  end?: string;
};

@Injectable()
export class ReviewService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
  ) {}

  async create(
    user: UserDocument,
    input: CreateReviewDto | CreateReviewDto[],
  ): Promise<ReviewDocument | ReviewDocument[]> {
    const items = Array.isArray(input) ? input : [input];
    if (items.length === 0) throw new BadRequestException("Empty payload");
    if (items.length > 20) {
      throw new BadRequestException("Batch size too large (max 20)");
    }
    const keys = new Set<string>();
    for (const item of items) {
      this.validate(item);
      const key = `${item.targetType}:${item.target}`;
      if (keys.has(key)) throw new BadRequestException("Duplicate review in batch");
      keys.add(key);
      if (user.role !== "admin" && !(await this.canCreate(user, item))) {
        throw new ForbiddenException("Not allowed to review this target");
      }
      if (
        await this.reviews.exists({
          author: user._id,
          targetType: item.targetType,
          target: item.target,
        })
      ) {
        throw new BadRequestException(
          `You have already reviewed this ${item.targetType.toLowerCase()}`,
        );
      }
    }

    const docs = items.map((item) => ({
      author: user._id,
      targetType: item.targetType,
      target: new Types.ObjectId(item.target),
      content: this.clean(item.content),
      rate: Number(item.rate),
    }));
    try {
      if (Array.isArray(input)) {
        return this.connection.transaction((session) =>
          this.reviews.insertMany(docs, { session }),
        );
      }
      return await this.reviews.create(docs[0]!);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new BadRequestException("You have already reviewed this item");
      }
      throw error;
    }
  }

  async list(query: ReviewQueryDto) {
    const filter: Record<string, unknown> = {
      targetType: query.targetType,
      target: query.target,
    };
    if (query.from || query.to) {
      const createdAt: { $gte?: Date; $lte?: Date } = {};
      if (query.from) createdAt.$gte = new Date(query.from);
      if (query.to) createdAt.$lte = new Date(query.to);
      filter.createdAt = createdAt;
    }
    return this.page(filter, query.page, query.limit);
  }

  async listOwn(
    user: UserDocument,
    pageValue?: string,
    limitValue?: string,
    targetType?: string,
  ) {
    const page = Math.max(Number(pageValue) || 1, 1);
    const limit = Math.min(Math.max(Number(limitValue) || 20, 1), 50);
    const filter: Record<string, unknown> = { author: user._id };
    if (targetType && ["Course", "Mentor", "Booking"].includes(targetType)) {
      filter.targetType = targetType;
    }
    const result = await this.page(filter, page, limit);
    return {
      ...result,
      items: await Promise.all(
        result.items.map(async (item) => ({
          ...item,
          targetInfo: await this.targetInfo(item.targetType, item.target),
        })),
      ),
    };
  }

  async listBookingReviews(
    mentorId: string,
    pageValue?: string,
    limitValue?: string,
  ) {
    this.assertId(mentorId, "mentor");
    const bookingIds = await this.bookings.distinct("_id", { mentor: mentorId });
    return this.page(
      { targetType: "Booking", target: { $in: bookingIds } },
      Math.max(Number(pageValue) || 1, 1),
      Math.min(Math.max(Number(limitValue) || 20, 1), 50),
    );
  }

  async update(
    user: UserDocument,
    id: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewDocument> {
    this.assertId(id, "review");
    if (dto.content === undefined && dto.rate === undefined) {
      throw new BadRequestException(
        "At least one field (content or rate) is required",
      );
    }
    const review = await this.reviews.findById(id);
    if (!review) throw new NotFoundException("Review not found");
    this.assertOwner(user, review);
    if (dto.content !== undefined) review.content = this.clean(dto.content);
    if (dto.rate !== undefined) review.rate = dto.rate;
    await review.save();
    return review;
  }

  async remove(user: UserDocument, id: string) {
    this.assertId(id, "review");
    const review = await this.reviews.findById(id);
    if (!review) throw new NotFoundException("Review not found");
    this.assertOwner(user, review);
    await review.deleteOne();
    return { success: true, id };
  }

  private async page(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
  ) {
    const [items, total] = await Promise.all([
      this.reviews
        .find(filter)
        .populate("author", "firstName lastName avatarUrl")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.reviews.countDocuments(filter),
    ]);
    return {
      items: items.map((item) => ({ ...item, content: this.clean(item.content) })),
      total,
      page,
      limit,
    };
  }

  private async canCreate(
    user: UserDocument,
    item: CreateReviewDto,
  ): Promise<boolean> {
    const userId = user._id;
    if (item.targetType === "Booking") {
      return Boolean(
        await this.bookings.exists({
          _id: item.target,
          status: { $in: ["active", "finished"] },
          $or: [{ mentor: userId }, { mentee: userId }],
        }),
      );
    }
    if (item.targetType === "Mentor") {
      if (
        await this.bookings.exists({
          mentor: item.target,
          mentee: userId,
          status: { $in: ["active", "finished"] },
        })
      ) {
        return true;
      }
      return Boolean(
        await this.connection.collection<CourseRecord>("courses").findOne({
          mentor: new Types.ObjectId(item.target),
          mentees: userId,
        }),
      );
    }
    const course = await this.connection
      .collection<CourseRecord>("courses")
      .findOne({ _id: new Types.ObjectId(item.target) });
    return Boolean(
      course &&
        (String(course.mentor) === String(userId) ||
          course.mentees?.some((id) => String(id) === String(userId))),
    );
  }

  private async targetInfo(targetType: ReviewTargetType, target: Types.ObjectId) {
    if (targetType === "Course") {
      const course = await this.connection
        .collection<CourseRecord>("courses")
        .findOne({ _id: target });
      return { title: course?.title ?? "Unknown", thumbnail: course?.thumbnail };
    }
    if (targetType === "Mentor") {
      const mentor = await this.user(target);
      return {
        title: this.name(mentor),
        thumbnail: mentor?.avatarUrl,
        mentorSpecialty: mentor?.skills?.join(", ") || "Mentoring",
      };
    }
    const booking = await this.connection
      .collection<BookingRecord>("bookings")
      .findOne({ _id: target });
    const mentor = booking ? await this.user(booking.mentor) : null;
    return {
      title: `Consultation with ${this.name(mentor)}`,
      thumbnail: mentor?.avatarUrl,
      mentorSpecialty: mentor?.skills?.join(", ") || "Consulting",
      consultationDate: booking?.date,
      consultationTime:
        booking?.start && booking.end
          ? `${booking.start} - ${booking.end}`
          : booking?.start,
    };
  }

  private user(id: Types.ObjectId) {
    return this.connection
      .collection<UserRecord>("users")
      .findOne({ _id: id });
  }

  private name(user: UserRecord | null): string {
    return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown";
  }

  private validate(item: CreateReviewDto): void {
    if (!item || !["Course", "Mentor", "Booking"].includes(item.targetType)) {
      throw new BadRequestException("Invalid target type");
    }
    this.assertId(item.target, "target");
    if (!Number.isInteger(Number(item.rate)) || item.rate < 1 || item.rate > 5) {
      throw new BadRequestException("Rate must be integer between 1-5");
    }
    if (item.content !== undefined && String(item.content).length > 2000) {
      throw new BadRequestException("Content is too long");
    }
  }

  private assertOwner(user: UserDocument, review: ReviewDocument): void {
    if (user.role !== "admin" && String(review.author) !== String(user._id)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  private assertId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} id`);
    }
  }

  private clean(content?: string): string {
    return sanitizeHtml(String(content ?? "").trim(), {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
}
