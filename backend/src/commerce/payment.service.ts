import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { EnrolmentService } from "../learning/enrolment.service";
import { Order } from "./order.schema";
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
    private readonly enrolments: EnrolmentService,
  ) {}

  async create(
    provider: PaymentProvider,
    user: UserDocument,
    orderNumber: string,
    ipAddress: string,
    returnUrl: string,
  ) {
    const order = await this.owned(user, orderNumber);
    if (order.status !== "pending") {
      throw new BadRequestException(
        "Đơn hàng không ở trạng thái chờ thanh toán!",
      );
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
      for (const item of order.items) {
        await this.enrolments.grantCourseAccess({
          menteeId: String(order.mentee),
          courseId: String(item.courseId),
          orderId: String(order._id),
          price: item.price,
          session,
        });
      }
      order.status = "paid";
      order.coursesGranted = true;
      order.grantedAt = new Date();
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
        if (Number(order.totalAmount || order.amount) !== payment.amount) {
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
          for (const item of order.items) {
            await this.enrolments.grantCourseAccess({
              menteeId: String(order.mentee),
              courseId: String(item.courseId),
              orderId: String(order._id),
              price: item.price,
              session,
            });
          }
          order.status = "paid";
          order.coursesGranted = true;
          order.grantedAt = new Date();
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
