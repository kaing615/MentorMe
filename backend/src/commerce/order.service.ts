import crypto from "node:crypto";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, FilterQuery, Model } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { Course } from "../learning/course.schema";
import { Cart } from "./cart.schema";
import type { CreateOrderDto } from "./dto/create-order.dto";
import type { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { Order, type OrderDocument } from "./order.schema";
import { assertOrderTransition } from "./order-state";

@Injectable()
export class OrderService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Cart.name) private readonly carts: Model<Cart>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
  ) {}

  async create(user: UserDocument, dto: CreateOrderDto) {
    return this.connection.transaction(async (session) => {
      const cart = dto.courses?.length
        ? null
        : await this.carts.findOne({ user: user._id }).session(session);
      const ids = dto.courses?.length
        ? dto.courses.map(({ courseId }) => courseId)
        : cart?.courses.map(({ course }) => String(course)) ?? [];
      if (!ids.length) throw new BadRequestException("Giỏ hàng trống!");
      const courses = await this.courses
        .find({ _id: { $in: ids } })
        .session(session);
      if (courses.length !== new Set(ids).size) {
        throw new BadRequestException("Khóa học không tồn tại!");
      }
      const subtotalAmount = courses.reduce((sum, course) => sum + course.price, 0);
      const discountAmount = cart?.discountAmount ?? 0;
      const totalAmount = subtotalAmount - discountAmount;
      const billing = dto.billingInfo ?? {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      const order = new this.orders({
        orderNumber: `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
        mentee: user._id,
        userId: user._id,
        items: courses.map((course) => ({
          courseId: course._id,
          title: course.title,
          price: course.price,
          quantity: 1,
          thumbnail: course.thumbnail,
        })),
        courses: courses.map(({ _id }) => _id),
        type: "course",
        subtotalAmount,
        discountCode: cart?.discountCode ?? dto.discountCode ?? "",
        discountAmount,
        amount: totalAmount,
        totalAmount,
        billingInfo: {
          ...billing,
          country: billing.country ?? "Vietnam",
          address: billing.address ?? "",
        },
        paymentInfo: {
          method: dto.paymentMethod === "bank" ? "bank_transfer" : dto.paymentMethod ?? "bank_transfer",
          paymentGateway: "manual",
        },
        paymentMethod: dto.paymentMethod ?? "bank",
      });
      await order.save({ session });
      if (cart) await this.carts.deleteOne({ _id: cart._id }, { session });
      return {
        message: cart ? "Tạo đơn hàng thành công!" : "Tạo order thành công!",
        order,
      };
    });
  }

  async list(user: UserDocument, status?: string, page = 1, limit = 10) {
    const filter: FilterQuery<Order> = {
      $or: [{ userId: user._id }, { mentee: user._id }],
    };
    if (status) filter.status = status;
    const [orders, totalOrders] = await Promise.all([
      this.orders
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.orders.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalOrders / limit);
    return {
      orders: orders.map((order) => this.summary(order)),
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async detail(user: UserDocument, orderNumber: string) {
    const order = await this.findOwned(user, orderNumber);
    await order.populate(
      "items.courseId",
      "title description thumbnail price category duration",
    );
    return {
      order: {
        orderNumber: order.orderNumber,
        formattedOrderNumber: this.formatted(order.orderNumber),
        items: order.items,
        summary: {
          subtotal: order.subtotalAmount || order.amount,
          discount: order.discountAmount || 0,
          total: order.totalAmount || order.amount,
        },
        billingInfo: order.billingInfo,
        paymentInfo: order.paymentInfo,
        status: order.status,
        coursesGranted: order.coursesGranted,
        grantedAt: order.grantedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        notes: order.notes ?? order.note,
      },
    };
  }

  async cancel(user: UserDocument, orderNumber: string, reason?: string) {
    const order = await this.findOwned(user, orderNumber);
    assertOrderTransition(order.status, "cancelled");
    order.status = "cancelled";
    order.note = reason ?? "Hủy bởi khách hàng";
    await order.save();
    return {
      message: "Hủy đơn hàng thành công!",
      order: { orderNumber, status: order.status },
    };
  }

  async statistics(user: UserDocument) {
    const orders = await this.orders
      .find({ $or: [{ userId: user._id }, { mentee: user._id }] })
      .sort({ createdAt: -1 });
    const completed = orders.filter(({ status }) =>
      ["paid", "completed"].includes(status),
    );
    return {
      statistics: {
        totalOrders: orders.length,
        totalSpent: completed.reduce((sum, order) => sum + order.totalAmount, 0),
        completedOrders: completed.length,
        successRate: orders.length
          ? Math.round((completed.length / orders.length) * 100)
          : 0,
      },
      recentOrders: orders.slice(0, 5).map((order) => ({
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
    };
  }

  async all(user: UserDocument, status?: string, page = 1, limit = 20) {
    this.admin(user);
    const filter: FilterQuery<Order> = status ? { status } : {};
    const [orders, totalOrders] = await Promise.all([
      this.orders
        .find(filter)
        .populate("mentee", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.orders.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalOrders / limit);
    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateStatus(
    user: UserDocument,
    orderNumber: string,
    dto: UpdateOrderStatusDto,
  ) {
    this.admin(user);
    const order = await this.orders.findOne({ orderNumber });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng!");
    assertOrderTransition(order.status, dto.status);
    order.status = dto.status;
    if (dto.notes !== undefined) order.notes = dto.notes;
    if (dto.transactionId !== undefined) order.transactionId = dto.transactionId;
    await order.save();
    return {
      message: "Cập nhật trạng thái đơn hàng thành công!",
      order: {
        orderNumber,
        status: order.status,
        transactionId: order.transactionId,
        updatedAt: order.updatedAt,
      },
    };
  }

  private async findOwned(
    user: UserDocument,
    orderNumber: string,
  ): Promise<OrderDocument> {
    const order = await this.orders.findOne({
      orderNumber,
      $or: [{ userId: user._id }, { mentee: user._id }],
    });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng!");
    return order;
  }

  private summary(order: OrderDocument) {
    return {
      orderNumber: order.orderNumber,
      formattedOrderNumber: this.formatted(order.orderNumber),
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      coursesGranted: order.coursesGranted,
    };
  }

  private formatted(value: string): string {
    return value.startsWith("ORD-") ? value : `ORD-${value.slice(3)}`;
  }

  private admin(user: UserDocument): void {
    if (user.role !== "admin") throw new ForbiddenException();
  }
}
