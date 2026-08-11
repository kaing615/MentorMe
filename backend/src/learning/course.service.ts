import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, FilterQuery, Model } from "mongoose";
import { Types } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { User } from "../identity/user.schema";
import { CloudinaryService } from "../infrastructure/files/cloudinary.service";
import { Review } from "../mentoring/review.schema";
import { ReviewService } from "../mentoring/review.service";
import { Course, type CourseDocument } from "./course.schema";
import type { AddCourseReviewDto } from "./dto/add-course-review.dto";
import type { CourseQueryDto } from "./dto/course-query.dto";
import type { CreateCourseDto } from "./dto/create-course.dto";
import type { UpdateCourseDto } from "./dto/update-course.dto";
import { Lesson } from "./lesson.schema";
import { PurchasedCourse } from "./purchased-course.schema";

type LessonInput = {
  title: string;
  description?: string;
  videoUrl?: string;
  documentUrl?: string;
  order?: number;
};

const PUBLIC_COURSE_SELECT = "-link -lessons -mentees -thumbnailPublicId";

@Injectable()
export class CourseService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(Lesson.name) private readonly lessons: Model<Lesson>,
    @InjectModel(PurchasedCourse.name)
    private readonly purchases: Model<PurchasedCourse>,
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly reviews: ReviewService,
    private readonly files: CloudinaryService,
  ) {}

  async list(query: CourseQueryDto) {
    const filter = this.filter(query);
    const skip = (query.page - 1) * query.limit;
    const [courses, total] = await Promise.all([
      this.courses
        .find(filter)
        .select(PUBLIC_COURSE_SELECT)
        .populate("mentor", "userName avatarUrl jobTitle")
        .skip(skip)
        .limit(query.limit)
        .sort(this.sort(query.sortBy)),
      this.courses.countDocuments(filter),
    ]);
    return {
      message: "Lấy danh sách khóa học thành công!",
      total,
      totalPages: Math.ceil(total / query.limit),
      currentPage: query.page,
      skip,
      limit: query.limit,
      courses: courses.map((course) => this.withCourseId(course)),
    };
  }

  async detail(id: string) {
    this.assertId(id);
    const course = await this.courses
      .findById(id)
      .select(PUBLIC_COURSE_SELECT)
      .populate("mentor", "userName firstName lastName avatarUrl");
    if (!course) throw new NotFoundException("Khóa học không tồn tại!");
    return {
      message: "Lấy thông tin khóa học thành công!",
      course: this.withCourseId(course),
    };
  }

  async related(courseId?: string, category?: string, limitValue?: string) {
    let categories = this.csv(category);
    if (!categories.length && courseId) {
      this.assertId(courseId);
      const current = await this.courses.findById(courseId).select("category");
      if (current?.category) categories = [current.category];
    }
    const filter: FilterQuery<Course> = {};
    if (courseId) filter._id = { $ne: courseId };
    if (categories.length) filter.category = { $in: categories };
    const courses = await this.courses
      .find(filter)
      .select(PUBLIC_COURSE_SELECT)
      .populate("mentor", "userName email avatarUrl")
      .sort({ rate: -1, createdAt: -1 })
      .limit(Math.min(Number(limitValue) || 6, 50));
    return {
      message: "Lấy khoá học liên quan thành công!",
      total: courses.length,
      courses: courses.map((course) => this.withCourseId(course)),
    };
  }

  async byMentor(mentorId: string, page = 1, limit = 10) {
    this.assertId(mentorId);
    const [courses, total] = await Promise.all([
      this.courses
        .find({ mentor: mentorId })
        .select(PUBLIC_COURSE_SELECT)
        .populate("mentor", "firstName lastName avatarUrl jobTitle")
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 }),
      this.courses.countDocuments({ mentor: mentorId }),
    ]);
    return {
      message: "Lấy khóa học theo mentor thành công.",
      data: { courses, totalPages: Math.ceil(total / limit), currentPage: page, total },
    };
  }

  async own(user: UserDocument, query: CourseQueryDto) {
    if (user.role !== "mentor") {
      throw new ForbiddenException("Only mentors can access their courses.");
    }
    const filter = this.filter(query);
    filter.mentor = user._id;
    const skip = (query.page - 1) * query.limit;
    const [courses, totalCourses] = await Promise.all([
      this.courses
        .find(filter)
        .populate("mentor", "userName avatarUrl")
        .skip(skip)
        .limit(query.limit)
        .sort(this.sort(query.sortBy)),
      this.courses.countDocuments(filter),
    ]);
    return {
      courses,
      totalCourses,
      totalPages: Math.ceil(totalCourses / query.limit),
      currentPage: query.page,
    };
  }

  async create(
    user: UserDocument,
    dto: CreateCourseDto,
    file?: Express.Multer.File,
  ) {
    if (user.role !== "mentor") {
      throw new ForbiddenException("Chỉ mentor mới có thể tạo khóa học.");
    }
    const description = dto.courseOverview ?? dto.description;
    const link = dto.driveLink ?? dto.link;
    if (!description) {
      throw new BadRequestException("Course description or overview is required");
    }
    if (!link) throw new BadRequestException("Course link or drive link is required");
    const thumbnail = file
      ? await this.files.uploadCourseThumbnail(file, String(user._id))
      : { url: "", publicId: "" };
    const course = await this.courses.create({
      title: dto.title,
      description,
      keyLearningObjectives: dto.keyLearningObjectives,
      price: dto.price,
      mentor: user._id,
      category: dto.category,
      tags: this.listValue(dto.tags),
      language: this.listValue(dto.language),
      duration: dto.duration ?? 0,
      link,
      lectures: dto.lectures,
      level: dto.level,
      thumbnail: thumbnail.url,
      thumbnailPublicId: thumbnail.publicId,
    });
    const populated = await this.courses
      .findById(course._id)
      .populate("mentor", "userName firstName lastName avatarUrl jobTitle");
    return { message: "Tạo khóa học thành công.", data: populated };
  }

  async update(
    user: UserDocument,
    id: string,
    dto: UpdateCourseDto,
    file?: Express.Multer.File,
  ): Promise<CourseDocument> {
    const course = await this.owned(user, id);
    if (dto.title !== undefined) course.title = dto.title;
    if (dto.price !== undefined) course.price = dto.price;
    if (dto.courseOverview !== undefined) course.description = dto.courseOverview;
    else if (dto.description !== undefined) course.description = dto.description;
    if (dto.keyLearningObjectives !== undefined) {
      course.keyLearningObjectives = dto.keyLearningObjectives;
    }
    if (dto.category !== undefined) course.category = dto.category;
    if (dto.level !== undefined) course.level = dto.level;
    if (dto.lectures !== undefined) course.lectures = dto.lectures;
    if (dto.duration !== undefined) course.duration = dto.duration;
    if (dto.driveLink !== undefined) course.link = dto.driveLink;
    else if (dto.link !== undefined) course.link = dto.link;
    if (dto.tags !== undefined) course.tags = this.listValue(dto.tags);
    if (dto.language !== undefined) course.language = this.listValue(dto.language);
    if (file) {
      const old = course.thumbnailPublicId;
      const uploaded = await this.files.uploadCourseThumbnail(file, String(user._id));
      course.thumbnail = uploaded.url;
      course.thumbnailPublicId = uploaded.publicId;
      if (old) await this.files.delete(old);
    }
    await course.save();
    return course;
  }

  async remove(user: UserDocument, id: string) {
    const course = await this.owned(user, id);
    if (
      course.mentees.length > 0 ||
      (await this.purchases.exists({ course: course._id }))
    ) {
      throw new ConflictException(
        "Không thể xóa khóa học đã có học viên. Hãy ngừng hiển thị khóa học thay vì xóa.",
      );
    }
    await this.connection.transaction(async (session) => {
      await this.lessons.deleteMany({ course: id }, { session });
      await this.reviewModel.deleteMany(
        { target: id, targetType: "Course" },
        { session },
      );
      await this.courses.deleteOne({ _id: id }, { session });
    });
    if (course.thumbnailPublicId) {
      await this.files.delete(course.thumbnailPublicId).catch(() => undefined);
    }
    return { message: "Course deleted successfully." };
  }

  async addReview(user: UserDocument, id: string, dto: AddCourseReviewDto) {
    this.assertId(id);
    if (!(await this.courses.exists({ _id: id }))) {
      throw new NotFoundException("Course not found.");
    }
    const review = await this.reviews.create(user, {
      targetType: "Course",
      target: id,
      rate: dto.rating,
      ...(dto.comment !== undefined && { content: dto.comment }),
    });
    return review;
  }

  async courseReviews(id: string) {
    this.assertId(id);
    const result = await this.reviews.list({
      targetType: "Course",
      target: id,
      page: 1,
      limit: 50,
    });
    return result.items;
  }

  async allReviews(page = 1, limit = 10, sortBy = "latest") {
    const sort =
      sortBy === "oldest"
        ? { createdAt: 1 as const }
        : sortBy === "highest-rating"
          ? { rate: -1 as const }
          : sortBy === "lowest-rating"
            ? { rate: 1 as const }
            : { createdAt: -1 as const };
    const [reviews, totalReviews] = await Promise.all([
      this.reviewModel
        .find({ targetType: "Course" })
        .populate("author", "userName firstName lastName avatarUrl")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      this.reviewModel.countDocuments({ targetType: "Course" }),
    ]);
    return {
      reviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
    };
  }

  async addMentor(user: UserDocument, courseId: string, mentorId: string) {
    if (user.role !== "admin") throw new ForbiddenException();
    this.assertId(mentorId);
    const mentor = await this.users.exists({ _id: mentorId, role: "mentor" });
    if (!mentor) {
      throw new BadRequestException("Invalid mentor ID or user is not a mentor.");
    }
    const course = await this.courses.findByIdAndUpdate(
      courseId,
      { $addToSet: { mentors: mentorId } },
      { new: true },
    ).populate("mentors", "userName avatarUrl");
    if (!course) throw new NotFoundException("Course not found.");
    return course;
  }

  async removeMentor(user: UserDocument, courseId: string, mentorId: string) {
    if (user.role !== "admin") throw new ForbiddenException();
    const course = await this.courses.findOneAndUpdate(
      { _id: courseId, mentors: mentorId },
      { $pull: { mentors: mentorId } },
      { new: true },
    ).populate("mentors", "userName avatarUrl");
    if (!course) throw new BadRequestException("Mentor is not assigned to this course.");
    return course;
  }

  async addContent(user: UserDocument, courseId: string, input: LessonInput) {
    await this.owned(user, courseId);
    return this.connection.transaction(async (session) => {
      const [lesson] = await this.lessons.create(
        [{ ...input, course: courseId }],
        { session },
      );
      const course = await this.courses.findByIdAndUpdate(
        courseId,
        { $addToSet: { lessons: lesson!._id } },
        { new: true, session },
      ).populate("lessons");
      if (!course) throw new NotFoundException("Course not found.");
      return course;
    });
  }

  async removeContent(user: UserDocument, courseId: string, lessonId: string) {
    await this.owned(user, courseId);
    return this.connection.transaction(async (session) => {
      const lesson = await this.lessons.findOneAndDelete(
        { _id: lessonId, course: courseId },
        { session },
      );
      if (!lesson) throw new NotFoundException("Content not found in this course.");
      const course = await this.courses.findByIdAndUpdate(
        courseId,
        { $pull: { lessons: lessonId } },
        { new: true, session },
      ).populate("lessons");
      if (!course) throw new NotFoundException("Course not found.");
      return course;
    });
  }

  async purchaseStatus(user: UserDocument, id: string) {
    const course = await this.courses.findById(id);
    if (!course) throw new NotFoundException("Khóa học không tồn tại!");
    const isPurchased = course.mentees.some(
      (mentee) => String(mentee) === String(user._id),
    );
    return {
      message: isPurchased ? "Bạn đã mua khóa học này." : "Bạn chưa mua khóa học này.",
      isPurchased,
      courseId: id,
      courseTitle: course.title,
    };
  }

  private async owned(user: UserDocument, id: string): Promise<CourseDocument> {
    this.assertId(id);
    const course = await this.courses.findById(id);
    if (!course) throw new NotFoundException("Course not found.");
    if (user.role !== "admin" && String(course.mentor) !== String(user._id)) {
      throw new ForbiddenException("You do not have permission to modify this course.");
    }
    return course;
  }

  private filter(query: CourseQueryDto): FilterQuery<Course> {
    const filter: FilterQuery<Course> = {};
    if (query.category) filter.category = query.category;
    if (query.mentor) filter.mentor = query.mentor;
    if (query.rate) filter.rate = { $gte: Number(query.rate) };
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }
    if (query.filterBy) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(query.filterBy) as unknown;
      } catch {
        throw new BadRequestException("Invalid filterBy format.");
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new BadRequestException("Invalid filterBy format.");
      }
      const values = parsed as Record<string, unknown>;
      if (typeof values.category === "string") filter.category = values.category;
      if (typeof values.level === "string") filter.level = values.level;
      if (typeof values.language === "string") filter.language = values.language;
      const price: { $gte?: number; $lte?: number } = {};
      if (values.priceMin !== undefined) price.$gte = Number(values.priceMin);
      if (values.priceMax !== undefined) price.$lte = Number(values.priceMax);
      if (Object.keys(price).length) filter.price = price;
    }
    return filter;
  }

  private sort(value?: string): Record<string, 1 | -1> {
    if (value === "oldest") return { createdAt: 1 };
    if (value === "rating") return { rate: -1, createdAt: -1 };
    if (value === "priceAsc") return { price: 1, createdAt: -1 };
    if (value === "priceDesc") return { price: -1, createdAt: -1 };
    return { createdAt: -1 };
  }

  private withCourseId(course: CourseDocument) {
    const value = course.toObject();
    return { ...value, courseId: value._id };
  }

  private listValue(value?: string | string[]): string[] {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (!value) return [];
    if (value.trim().startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        // Fall through to comma parsing.
      }
    }
    return this.csv(value);
  }

  private csv(value?: string): string[] {
    return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid course id");
  }
}
