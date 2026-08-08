import Course from "../../models/course.model.js";
import Order from "../../models/order.model.js";
import PurchasedCourse from "../../models/purchasedCourse.model.js";
import { appendOutboxEvent } from "../../infrastructure/outbox/write-event.js";
import { withTransaction } from "../../infrastructure/transaction.js";
import { assertOrderTransition } from "./order-state.js";

function paymentError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function resolveQuery(query, session) {
  return query?.session ? query.session(session) : query;
}

export async function markOrderProcessing(
  orderNumber,
  { OrderModel = Order } = {}
) {
  assertOrderTransition("pending", "processing");
  const order = await OrderModel.findOneAndUpdate(
    { orderNumber, status: "pending" },
    { $set: { status: "processing" }, $inc: { aggregateVersion: 1 } },
    { new: true }
  );
  if (!order) {
    throw paymentError("ORDER_NOT_PENDING", "Order is not pending");
  }
  return order.toObject ? order.toObject() : order;
}

export async function applyVerifiedPayment(
  callback,
  {
    CourseModel = Course,
    OrderModel = Order,
    PurchasedCourseModel = PurchasedCourse,
    appendEvent = appendOutboxEvent,
    transactionRunner = withTransaction,
  } = {}
) {
  return transactionRunner(async (session) => {
    const order = await resolveQuery(
      OrderModel.findOne({ orderNumber: callback.orderNumber }),
      session
    );
    if (!order) throw paymentError("ORDER_NOT_FOUND", "Order not found");

    if (
      order.providerEventId === callback.providerEventId &&
      new Set(["paid", "completed", "failed"]).has(order.status)
    ) {
      return order.toObject ? order.toObject() : { ...order };
    }
    if (Number(order.totalAmount || order.amount) !== Number(callback.amount)) {
      throw paymentError(
        "PAYMENT_AMOUNT_MISMATCH",
        "Provider amount does not match the order"
      );
    }

    if (!callback.success) {
      assertOrderTransition(order.status, "failed");
      const result = await OrderModel.updateOne(
        { _id: order._id, status: order.status },
        {
          $set: {
            status: "failed",
            providerEventId: callback.providerEventId,
            transactionId: callback.transactionId,
            "paymentInfo.paymentGateway": callback.provider,
            "paymentInfo.transactionId": callback.transactionId,
            "paymentInfo.paymentData": callback.paymentData || {},
          },
          $inc: { aggregateVersion: 1 },
        },
        { session }
      );
      if (result.modifiedCount !== 1) {
        throw paymentError("ORDER_CONCURRENT_UPDATE", "Order changed concurrently");
      }
      await appendEvent(
        {
          eventType: "payment.failed",
          aggregateId: order._id,
          aggregateVersion: (order.aggregateVersion || 1) + 1,
          payload: {
            orderId: String(order._id),
            provider: callback.provider,
            providerEventId: callback.providerEventId,
          },
        },
        { session }
      );
      return { ...(order.toObject ? order.toObject() : order), status: "failed" };
    }

    assertOrderTransition(order.status, "paid");
    assertOrderTransition("paid", "completed");
    const userId = order.mentee || order.userId;
    const courseItems = order.items?.length
      ? order.items
      : (order.courses || []).map((courseId) => ({ courseId, price: 0 }));
    for (const item of courseItems) {
      await PurchasedCourseModel.updateOne(
        { mentee: userId, course: item.courseId },
        {
          $setOnInsert: {
            mentee: userId,
            course: item.courseId,
            order: order._id,
            price: item.price || 0,
            purchaseDate: new Date(),
          },
        },
        { upsert: true, session }
      );
      await CourseModel.updateOne(
        { _id: item.courseId },
        { $addToSet: { mentees: userId } },
        { session }
      );
    }

    const paidAt = new Date();
    const updateResult = await OrderModel.updateOne(
      { _id: order._id, status: order.status },
      {
        $set: {
          status: "completed",
          providerEventId: callback.providerEventId,
          transactionId: callback.transactionId,
          paymentInfo: {
            ...(order.paymentInfo?.toObject?.() || order.paymentInfo || {}),
            method: callback.provider,
            paymentGateway: callback.provider,
            transactionId: callback.transactionId,
            paidAt,
            paymentData: callback.paymentData || {},
          },
          coursesGranted: true,
          grantedAt: paidAt,
        },
        $inc: { aggregateVersion: 2 },
      },
      { session }
    );
    if (updateResult.modifiedCount !== 1) {
      throw paymentError("ORDER_CONCURRENT_UPDATE", "Order changed concurrently");
    }

    const baseVersion = order.aggregateVersion || 1;
    await appendEvent(
      {
        eventType: "payment.completed",
        aggregateId: order._id,
        aggregateVersion: baseVersion + 1,
        payload: {
          orderId: String(order._id),
          provider: callback.provider,
          providerEventId: callback.providerEventId,
          transactionId: callback.transactionId,
        },
      },
      { session }
    );
    await appendEvent(
      {
        eventType: "course.purchased",
        aggregateId: order._id,
        aggregateVersion: baseVersion + 2,
        payload: {
          orderId: String(order._id),
          menteeId: String(userId),
          courseIds: courseItems.map((item) => String(item.courseId)),
        },
      },
      { session }
    );
    return {
      ...(order.toObject ? order.toObject() : order),
      status: "completed",
      providerEventId: callback.providerEventId,
      transactionId: callback.transactionId,
      aggregateVersion: baseVersion + 2,
      coursesGranted: true,
      grantedAt: paidAt,
    };
  });
}
