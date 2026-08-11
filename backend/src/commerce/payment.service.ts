import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { ClientSession, Connection, Model } from "mongoose";
import { hasUserRole } from "../common/auth/user-role";
import type { UserDocument } from "../identity/user.schema";
import { NotificationService } from "../engagement/notification.service";
import { EnrolmentService } from "../learning/enrolment.service";
import { Course } from "../learning/course.schema";
import { Booking } from "../mentoring/booking.schema";
import { Cart } from "./cart.schema";
import { Order, type OrderDocument } from "./order.schema";
import { MentorEarning } from "./mentor-earning.schema";
import { assertOrderTransition } from "./order-state";
import { PaymentEvent } from "./payment-event.schema";
import type {
  PaymentCallbackInput,
  PaymentProvider,
  VerifiedPayment,
} from "./payment-provider";
import type { ConfirmManualPaymentDto } from "./dto/confirm-manual-payment.dto";

export type CallbackResult = { duplicate: boolean; payment: VerifiedPayment };

@Injectable()
export class PaymentService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(PaymentEvent.name)
    private readonly events: Model<PaymentEvent>,
    @InjectModel(Cart.name) private readonly carts: Model<Cart>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(MentorEarning.name)
    private readonly earnings: Model<MentorEarning>,
    private readonly enrolments: EnrolmentService,
    private readonly notifications: NotificationService,
  ) {}

  async create(
    provider: PaymentProvider,
    user: UserDocument,
    orderNumber: string,
    ipAddress: string,
    returnUrl: string,
  ) {
    if (!hasUserRole(user, "mentee")) {
      throw new ForbiddenException("Only mentees can create payments");
    }
    const order = await this.owned(user, orderNumber);
    if (order.status !== "pending") {
      throw new BadRequestException(
        "Đơn hàng không ở trạng thái chờ thanh toán!",
      );
    }
    if (order.currency !== "VND") {
      throw new BadRequestException("Unsupported order currency");
    }
    const payment = await provider.create({
      orderNumber,
      amount: order.totalAmount,
      ipAddress,
      returnUrl,
    });
    order.status = "processing";
    await order.save();
    return {
      paymentUrl: payment.redirectUrl,
      orderNumber,
      providerReference: payment.providerReference,
    };
  }

  async status(user: UserDocument, orderNumber: string) {
    const order = await this.owned(user, orderNumber);
    return {
      orderNumber,
      status: order.status,
      paymentInfo: order.paymentInfo,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paidAt: order.paymentInfo?.paidAt,
      transactionId: order.transactionId ?? order.paymentInfo?.transactionId,
    };
  }

  async confirmManual(user: UserDocument, dto: ConfirmManualPaymentDto) {
    if (user.role !== "admin") throw new ForbiddenException();
    const transactionId = dto.transactionId ?? `MANUAL_${Date.now()}`;
    return this.connection.transaction(async (session) => {
      const order = await this.orders
        .findOne({ orderNumber: dto.orderNumber })
        .session(session);
      if (!order) throw new NotFoundException("Không tìm thấy đơn hàng!");
      assertOrderTransition(order.status, "paid");
      await this.settleOrder(order, transactionId, session);
      order.status = "paid";
      if (order.type === "course") {
        order.coursesGranted = true;
        order.grantedAt = new Date();
      }
      order.transactionId = transactionId;
      order.paymentInfo = {
        ...(order.paymentInfo ?? {}),
        method: "manual",
        paymentGateway: "manual",
        transactionId,
        paidAt: new Date(),
        paymentData: {},
      };
      if (dto.notes !== undefined) order.notes = dto.notes;
      await order.save({ session });
      await this.notifications.notify(
        {
          recipient: order.mentee,
          type: "payment_paid",
          title: "Payment successful",
          body:
            order.type === "booking"
              ? "Your mentoring session payment was confirmed."
              : "Your payment was confirmed and your courses are ready.",
          link:
            order.type === "booking"
              ? "/profile?tab=mybookings"
              : "/profile?tab=orders",
          metadata: { orderNumber: order.orderNumber },
          eventKey: `payment:paid:${String(order._id)}`,
        },
        session,
      );
      return {
        message: "Xác nhận thanh toán thành công!",
        order: { orderNumber: order.orderNumber, status: order.status, transactionId },
      };
    });
  }

  async handleCallback(
    provider: PaymentProvider,
    input: PaymentCallbackInput,
  ): Promise<CallbackResult> {
    const payment = await provider.verifyCallback(input);
    try {
      const result = await this.connection.transaction(async (session) => {
        if (
          await this.events.exists({
            provider: payment.provider,
            eventId: payment.eventId,
          }).session(session)
        ) {
          return { duplicate: true, payment };
        }
        const order = await this.orders
          .findOne({ orderNumber: payment.orderNumber })
          .session(session);
        if (!order) throw new NotFoundException("Order not found");
        if (
          order.currency !== "VND" ||
          Number(order.totalAmount || order.amount) !== payment.amount
        ) {
          throw new BadRequestException("Invalid amount");
        }

        await this.events.create(
          [
            {
              ...payment,
              order: order._id,
            },
          ],
          { session },
        );

        if (["paid", "completed"].includes(order.status)) {
          return { duplicate: true, payment };
        }

        if (payment.status === "paid") {
          assertOrderTransition(order.status, "paid");
          await this.settleOrder(order, payment.transactionId, session);
          order.status = "paid";
          if (order.type === "course") {
            order.coursesGranted = true;
            order.grantedAt = new Date();
          }
          order.transactionId = payment.transactionId;
          order.paymentInfo = {
            ...(order.paymentInfo ?? {}),
            method: payment.provider,
            paymentGateway: payment.provider,
            transactionId: payment.transactionId,
            paidAt: new Date(),
            paymentData: {},
          };
        } else {
          assertOrderTransition(order.status, "failed");
          order.status = "failed";
        }
        await order.save({ session });
        await this.notifications.notify(
          {
            recipient: order.mentee,
            type: payment.status === "paid" ? "payment_paid" : "payment_failed",
            title:
              payment.status === "paid"
                ? "Payment successful"
                : "Payment failed",
            body:
              payment.status === "paid"
                ? order.type === "booking"
                  ? "Your mentoring session payment was confirmed."
                  : "Your payment was confirmed and your courses are ready."
                : "Your payment could not be completed.",
            link:
              order.type === "booking"
                ? "/profile?tab=mybookings"
                : "/profile?tab=orders",
            metadata: { orderNumber: order.orderNumber },
            eventKey: `payment:${payment.status}:${String(order._id)}`,
          },
          session,
        );
        return { duplicate: false, payment };
      });
      return result;
    } catch (error) {
      if (this.isDuplicate(error)) return { duplicate: true, payment };
      throw error;
    }
  }

  private isDuplicate(error: unknown): boolean {
    return Boolean(
      error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000,
    );
  }

  private async settleOrder(
    order: OrderDocument,
    transactionId: string,
    session: ClientSession,
  ): Promise<void> {
    if (order.type === "booking") {
      const booking = await this.bookings.findById(order.booking).session(session);
      if (!booking) throw new NotFoundException("Booking not found");
      booking.paymentStatus = "paid";
      booking.paymentTransactionId = transactionId;
      await booking.save({ session });
      await this.earnings.updateOne(
        { sourceKey: `booking:${String(booking._id)}` },
        {
          $setOnInsert: {
            sourceKey: `booking:${String(booking._id)}`,
            sourceType: "booking",
            mentor: booking.mentor,
            mentee: booking.mentee,
            order: order._id,
            booking: booking._id,
            grossAmount: booking.price,
            platformFeeAmount: booking.platformFeeAmount,
            netAmount: booking.mentorNetAmount,
            currency: "VND",
            status: "pending",
          },
        },
        { upsert: true, session },
      );
      return;
    }

    for (const item of order.items) {
      await this.enrolments.grantCourseAccess({
        menteeId: String(order.mentee),
        courseId: String(item.courseId),
        orderId: String(order._id),
        price: item.price,
        session,
      });
      const course = await this.courses.findById(item.courseId).session(session);
      if (!course) throw new NotFoundException("Course not found");
      const platformFeeAmount = Math.round(item.price * 0.15);
      await this.earnings.updateOne(
        { sourceKey: `course:${String(order._id)}:${String(item.courseId)}` },
        {
          $setOnInsert: {
            sourceKey: `course:${String(order._id)}:${String(item.courseId)}`,
            sourceType: "course",
            mentor: course.mentor,
            mentee: order.mentee,
            order: order._id,
            course: item.courseId,
            grossAmount: item.price,
            platformFeeAmount,
            netAmount: item.price - platformFeeAmount,
            currency: "VND",
            status: "eligible",
            eligibleAt: new Date(),
          },
        },
        { upsert: true, session },
      );
    }
    await this.removePaidCoursesFromCart(
      order.mentee,
      order.items.map(({ courseId }) => courseId),
      session,
    );
  }

  private async removePaidCoursesFromCart(
    userId: unknown,
    courseIds: unknown[],
    session: import("mongoose").ClientSession,
  ): Promise<void> {
    const cart = await this.carts.findOne({ user: userId }).session(session);
    if (!cart) return;
    const paid = new Set(courseIds.map(String));
    cart.courses = cart.courses.filter(({ course }) => !paid.has(String(course)));
    if (!cart.courses.length) {
      await cart.deleteOne({ session });
      return;
    }
    const remaining = await this.courses
      .find({ _id: { $in: cart.courses.map(({ course }) => course) } })
      .select("price")
      .session(session);
    cart.totalPrice = remaining.reduce((sum, course) => sum + course.price, 0);
    cart.discountCode = "";
    cart.discountAmount = 0;
    await cart.save({ session });
  }

  private async owned(user: UserDocument, orderNumber: string) {
    const filter =
      user.role === "admin"
        ? { orderNumber }
        : {
            orderNumber,
            $or: [{ userId: user._id }, { mentee: user._id }],
          };
    const order = await this.orders.findOne(filter);
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng!");
    return order;
  }
}
