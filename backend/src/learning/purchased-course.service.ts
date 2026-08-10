import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import { Types } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { User } from "../identity/user.schema";
import { NotificationService } from "../engagement/notification.service";
import { Booking } from "../mentoring/booking.schema";
import { Course } from "./course.schema";
import type { AddPurchasedCourseReviewDto } from "./dto/add-purchased-course-review.dto";
import type { UpdateProgressDto } from "./dto/update-progress.dto";
import { PurchasedCourse, type PurchasedCourseDocument } from "./purchased-course.schema";
import { EnrolmentService } from "./enrolment.service";

type OrderRecord = {
  _id: Types.ObjectId;
  orderNumber?: string;
  totalAmount?: number;
  paymentMethod?: string;
  createdAt?: Date;
  mentee?: Types.ObjectId;
  userId?: Types.ObjectId;
  status?: string;
  courses?: Types.ObjectId[];
  items?: Array<{ courseId: Types.ObjectId; price?: number }>;
  coursesGranted?: boolean;
};

@Injectable()
export class PurchasedCourseService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(PurchasedCourse.name)
    private readonly purchases: Model<PurchasedCourse>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    private readonly enrolments: EnrolmentService,
    private readonly notifications: NotificationService,
  ) {}

  async list(user: UserDocument) {
    const purchases = await this.purchases
      .find({ mentee: user._id })
      .sort({ purchaseDate: -1 });
    const real = await Promise.all(
      purchases.map((purchase) => this.format(purchase, true)),
    );
    const excluded = purchases.map(({ course }) => course);
    const legacy = await this.courses
      .find({ mentees: user._id, _id: { $nin: excluded } })
      .sort({ createdAt: -1 });
    const fallback = await Promise.all(
      legacy.map(async (course) => {
        const mentor = await this.publicUser(course.mentor);
        return {
          purchasedCourseId: null,
          courseId: course._id,
          courseInfo: this.courseInfo(course, mentor, course.price),
          purchaseDate: course.createdAt,
          lastAccessDate: null,
          rating: null,
          review: null,
          orderInfo: {
            orderNumber: null,
            totalAmount: null,
            paymentMethod: null,
            createdAt: course.createdAt,
          },
          hasRealPurchasedRecord: false,
        };
      }),
    );
    return {
      message: "Lấy danh sách khóa học đã mua thành công.",
      totalCourses: real.length + fallback.length,
      purchasedCoursesCount: real.length,
      legacyCoursesCount: fallback.length,
      courses: [...real, ...fallback],
    };
  }

  async detail(user: UserDocument, id: string) {
    this.assertId(id);
    const purchase = await this.purchases.findOne({ _id: id, mentee: user._id });
    if (!purchase) {
      throw new NotFoundException(
        "Không tìm thấy khóa học đã mua hoặc bạn không có quyền truy cập.",
      );
    }
    purchase.lastAccessDate = new Date();
    await purchase.save();
    const formatted = await this.format(purchase, true);
    return {
      message: "Lấy chi tiết khóa học đã mua thành công.",
      data: {
        ...formatted,
        completedAt: purchase.completedAt,
      },
    };
  }

  async check(user: UserDocument, courseId: string) {
    this.assertId(courseId);
    const purchase = await this.purchases.findOne({
      mentee: user._id,
      course: courseId,
    });
    if (!purchase) {
      return {
        message: "Bạn chưa mua khóa học này.",
        isPurchased: false,
        courseData: null,
      };
    }
    const course = await this.courses
      .findById(courseId)
      .select("title description price thumbnail link");
    return {
      message: "Bạn đã mua khóa học này.",
      isPurchased: true,
      courseData: {
        courseId: course?._id,
        courseInfo: course,
        purchaseDate: purchase.purchaseDate,
        lastAccessDate: purchase.lastAccessDate,
      },
    };
  }

  async progress(user: UserDocument, id: string, dto: UpdateProgressDto) {
    this.assertId(id);
    return this.connection.transaction(async (session) => {
      const purchase = await this.purchases
        .findOne({ _id: id, mentee: user._id })
        .session(session);
      if (!purchase) {
        throw new NotFoundException(
          "Purchased course not found or you don't have permission.",
        );
      }
      const completedNow = !purchase.isCompleted && dto.progress === 100;
      purchase.progress = dto.progress;
      purchase.lastAccessDate = new Date();
      purchase.isCompleted = dto.progress === 100;
      purchase.completedAt = purchase.isCompleted ? new Date() : null;
      await purchase.save({ session });
      if (completedNow) {
        await this.notifications.notify(
          {
            recipient: user._id,
            type: "course_completed",
            title: "Course completed",
            body: "Congratulations! You completed your course.",
            link: `/purchased-courses/details/${String(purchase._id)}`,
            metadata: {
              purchasedCourseId: String(purchase._id),
              courseId: String(purchase.course),
            },
            eventKey: `course:completed:${String(purchase._id)}`,
          },
          session,
        );
      }
      return purchase;
    });
  }

  async review(
    user: UserDocument,
    id: string,
    dto: AddPurchasedCourseReviewDto,
  ) {
    const purchase = await this.owned(user, id);
    purchase.rating = dto.rating;
    purchase.review = dto.review ?? "";
    purchase.reviewDate = new Date();
    await purchase.save();
    return purchase;
  }

  async mentees(user: UserDocument) {
    if (user.role !== "mentor") throw new ForbiddenException();
    const courses = await this.courses.find({ mentor: user._id });
    const courseIds = courses.map(({ _id }) => _id);
    const [purchases, bookings] = await Promise.all([
      this.purchases.find({ course: { $in: courseIds } }),
      this.bookings.find({
        mentor: user._id,
        status: { $in: ["active", "finished"] },
      }),
    ]);
    const values = new Map<
      string,
      {
        _id: Types.ObjectId;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl: string;
        hasCoursePurchase: boolean;
        hasBooking: boolean;
        courseCount: number;
        bookingCount: number;
        latestInteraction: Date;
      }
    >();
    const courseMentees = courses.flatMap(({ mentees }) => mentees);
    const ids = new Set([
      ...courseMentees.map(String),
      ...purchases.map(({ mentee }) => String(mentee)),
      ...bookings.map(({ mentee }) => String(mentee)),
    ]);
    const people = await this.users.find({ _id: { $in: [...ids] } });
    for (const person of people) {
      const id = String(person._id);
      const relatedPurchases = purchases.filter(({ mentee }) => String(mentee) === id);
      const relatedBookings = bookings.filter(({ mentee }) => String(mentee) === id);
      values.set(id, {
        _id: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        avatarUrl: person.avatarUrl,
        hasCoursePurchase: courseMentees.some((mentee) => String(mentee) === id),
        hasBooking: relatedBookings.length > 0,
        courseCount: relatedPurchases.length ||
          courses.filter(({ mentees }) => mentees.some((mentee) => String(mentee) === id)).length,
        bookingCount: relatedBookings.length,
        latestInteraction: new Date(
          Math.max(
            0,
            ...relatedPurchases.map(({ purchaseDate }) => purchaseDate.getTime()),
            ...relatedBookings.map(({ createdAt }) => createdAt.getTime()),
          ),
        ),
      });
    }
    const mentees = [...values.values()].sort(
      (left, right) => right.latestInteraction.getTime() - left.latestInteraction.getTime(),
    );
    return { mentees, total: mentees.length };
  }

  async grantOrder(user: UserDocument, orderId: string) {
    this.assertId(orderId);
    return this.connection.transaction(async (session) => {
      const orders = this.connection.collection<OrderRecord>("orders");
      const order = await orders.findOne(
        { _id: new Types.ObjectId(orderId) },
        { session },
      );
      if (!order) throw new NotFoundException("Không tìm thấy đơn hàng.");
      const owner = order.mentee ?? order.userId;
      if (String(owner) !== String(user._id)) {
        throw new ForbiddenException("Đơn hàng không thuộc về bạn.");
      }
      if (!["paid", "completed"].includes(order.status ?? "")) {
        throw new BadRequestException("Đơn hàng chưa được thanh toán.");
      }
      const items = order.items?.length
        ? order.items
        : (order.courses ?? []).map((courseId) => ({ courseId, price: 0 }));
      if (!items.length) {
        throw new BadRequestException("Đơn hàng không có khóa học nào.");
      }
      if (order.coursesGranted) {
        return {
          message: "Đã thêm 0 khóa học vào danh sách đã mua.",
          coursesAdded: 0,
          totalCourses: items.length,
        };
      }
      for (const item of items) {
        await this.enrolments.grantCourseAccess({
          menteeId: String(user._id),
          courseId: String(item.courseId),
          orderId,
          price: item.price ?? 0,
          session,
        });
      }
      await orders.updateOne(
        { _id: order._id },
        { $set: { coursesGranted: true, grantedAt: new Date() } },
        { session },
      );
      return {
        message: `Đã thêm ${items.length} khóa học vào danh sách đã mua.`,
        coursesAdded: items.length,
        totalCourses: items.length,
      };
    });
  }

  private async format(purchase: PurchasedCourseDocument, real: boolean) {
    const course = await this.courses.findById(purchase.course);
    if (!course) throw new NotFoundException("Course not found.");
    const [mentor, order] = await Promise.all([
      this.publicUser(course.mentor),
      this.connection
        .collection<OrderRecord>("orders")
        .findOne({ _id: purchase.order }),
    ]);
    return {
      purchasedCourseId: purchase._id,
      courseId: course._id,
      courseInfo: this.courseInfo(course, mentor, purchase.price),
      purchaseDate: purchase.purchaseDate,
      lastAccessDate: purchase.lastAccessDate,
      rating: purchase.rating,
      review: purchase.review,
      orderInfo: {
        orderNumber: order?.orderNumber,
        totalAmount: order?.totalAmount,
        paymentMethod: order?.paymentMethod,
        createdAt: order?.createdAt,
      },
      hasRealPurchasedRecord: real,
    };
  }

  private courseInfo(course: Course, mentor: User | null, price: number) {
    return {
      _id: (course as Course & { _id: Types.ObjectId })._id,
      title: course.title,
      description: course.description,
      price,
      mentor,
      category: course.category,
      duration: course.duration,
      rate: course.rate,
      link: course.link,
      lectures: course.lectures,
      thumbnail: course.thumbnail,
    };
  }

  private publicUser(id: Types.ObjectId) {
    return this.users.findById(id).select(
      "firstName lastName avatarUrl jobTitle userName email",
    );
  }

  private async owned(user: UserDocument, id: string): Promise<PurchasedCourseDocument> {
    this.assertId(id);
    const purchase = await this.purchases.findOne({ _id: id, mentee: user._id });
    if (!purchase) {
      throw new NotFoundException(
        "Purchased course not found or you don't have permission.",
      );
    }
    return purchase;
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid id");
  }
}
