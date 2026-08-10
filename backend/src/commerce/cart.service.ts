import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { hasUserRole } from "../common/auth/user-role";
import type { UserDocument } from "../identity/user.schema";
import { Course } from "../learning/course.schema";
import { Cart, type CartDocument } from "./cart.schema";
import { Discount } from "./discount.schema";

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly carts: Model<Cart>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(Discount.name) private readonly discounts: Model<Discount>,
  ) {}

  async get(user: UserDocument) {
    const cart = await this.findOrCreate(user);
    await this.recalculate(cart);
    await cart.save();
    await cart.populate({
      path: "courses.course",
      select: "title description price category duration rate lectures mentor thumbnail",
      populate: {
        path: "mentor",
        select: "firstName lastName avatarUrl jobTitle",
      },
    });
    return {
      message: "Lấy giỏ hàng thành công.",
      totalCourses: cart.courses.length,
      totalPrice: cart.totalPrice,
      courses: cart.courses,
      cart,
    };
  }

  async add(user: UserDocument, courseId: string) {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundException("Không tìm thấy khóa học.");
    if (course.mentees.some((id) => String(id) === String(user._id))) {
      throw new BadRequestException("Bạn đã mua khóa học này rồi.");
    }
    const cart = await this.findOrCreate(user);
    if (cart.courses.some((item) => String(item.course) === courseId)) {
      throw new BadRequestException("Khóa học đã có trong giỏ hàng.");
    }
    cart.courses.push({ course: course._id, addedAt: new Date() } as never);
    await this.recalculate(cart);
    await cart.save();
    return {
      message: "Thêm khóa học vào giỏ hàng thành công.",
      courseId,
      courseTitle: course.title,
      totalCourses: cart.courses.length,
      totalPrice: cart.totalPrice,
      cart,
    };
  }

  async remove(user: UserDocument, courseId: string) {
    if (!(await this.courses.exists({ _id: courseId }))) {
      throw new NotFoundException("Không tìm thấy khóa học.");
    }
    const cart = await this.findOrCreate(user);
    const index = cart.courses.findIndex((item) => String(item.course) === courseId);
    if (index === -1) {
      throw new NotFoundException("Khóa học không có trong giỏ hàng.");
    }
    cart.courses.splice(index, 1);
    await this.recalculate(cart);
    await cart.save();
    return {
      message: "Xóa khóa học khỏi giỏ hàng thành công.",
      courseId,
      totalCourses: cart.courses.length,
      totalPrice: cart.totalPrice,
    };
  }

  async clear(user: UserDocument) {
    const cart = await this.findOrCreate(user);
    cart.courses.splice(0);
    cart.totalPrice = 0;
    await cart.save();
    return {
      message: "Xóa toàn bộ giỏ hàng thành công.",
      totalCourses: 0,
      totalPrice: 0,
    };
  }

  async check(user: UserDocument, courseId: string) {
    if (!(await this.courses.exists({ _id: courseId }))) {
      throw new NotFoundException("Không tìm thấy khóa học.");
    }
    const cart = await this.findOrCreate(user);
    return {
      message: "Kiểm tra giỏ hàng thành công.",
      courseId,
      inCart: cart.courses.some((item) => String(item.course) === courseId),
    };
  }

  async applyDiscount(user: UserDocument, code: string) {
    const cart = await this.findOrCreate(user);
    cart.discountCode = code.trim().toUpperCase();
    await this.recalculate(cart, true);
    await cart.save();
    return {
      message: "Cập nhật mã giảm giá thành công.",
      discountCode: cart.discountCode,
      discountAmount: cart.discountAmount,
      totalPrice: cart.totalPrice,
      cart,
    };
  }

  unsupportedQuantity(): never {
    throw new BadRequestException(
      "Khóa học là sản phẩm mua 1 lần, không hỗ trợ thay đổi số lượng.",
    );
  }

  private async findOrCreate(user: UserDocument): Promise<CartDocument> {
    if (!hasUserRole(user, "mentee")) {
      throw new ForbiddenException("Only mentees can use the cart");
    }
    return (
      (await this.carts.findOne({ user: user._id })) ??
      (await this.carts.create({ user: user._id, courses: [], totalPrice: 0 }))
    );
  }

  private async recalculate(
    cart: CartDocument,
    requireValidDiscount = false,
  ): Promise<void> {
    const ids = cart.courses.map(({ course }) => course);
    const courses = await this.courses.find({ _id: { $in: ids } }).select("price");
    const subtotal = courses.reduce((total, course) => total + course.price, 0);
    cart.discountAmount = 0;
    if (cart.discountCode) {
      const now = new Date();
      const discount = await this.discounts.findOne({
        code: cart.discountCode,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        quantity: { $gt: 0 },
      });
      if (!discount || subtotal < discount.minOrder) {
        if (requireValidDiscount) {
          throw new BadRequestException("Mã giảm giá không hợp lệ.");
        }
        cart.discountCode = "";
      } else {
        const eligible = discount.courses.length
          ? courses
              .filter((course) =>
                discount.courses.some((id) => String(id) === String(course._id)),
              )
              .reduce((sum, course) => sum + course.price, 0)
          : subtotal;
        cart.discountAmount = Math.min(
          subtotal,
          discount.type === "percent"
            ? eligible * Math.min(discount.value, 100) / 100
            : discount.value,
        );
      }
    }
    cart.totalPrice = subtotal - cart.discountAmount;
  }
}
