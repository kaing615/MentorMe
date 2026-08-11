import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import crypto from "node:crypto";
import type { ClientSession, Connection, Model } from "mongoose";
import { Types } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { User } from "../identity/user.schema";
import { hasUserRole } from "../common/auth/user-role";
import { NotificationService } from "../engagement/notification.service";
import { Availability } from "./availability.schema";
import { Booking, type BookingDocument } from "./booking.schema";
import { assertBookingTransition } from "./booking-state";
import type { CreateBookingDto } from "./dto/create-booking.dto";
import type { UpdateBookingDto } from "./dto/update-booking.dto";
import { Relationship } from "./relationship.schema";
import { Profile } from "./profile.schema";
import { Order, type OrderDocument } from "../commerce/order.schema";
import { MentorEarning } from "../commerce/mentor-earning.schema";
import { assertOrderTransition } from "../commerce/order-state";

type ActionResult = {
  message: string;
  booking: BookingDocument;
  order?: OrderDocument | null;
};

const PLATFORM_FEE_PERCENT = 15;

@Injectable()
export class BookingService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Availability.name)
    private readonly availabilities: Model<Availability>,
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Relationship.name)
    private readonly relationships: Model<Relationship>,
    @InjectModel(Profile.name) private readonly profiles: Model<Profile>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(MentorEarning.name)
    private readonly earnings: Model<MentorEarning>,
    private readonly notifications: NotificationService,
  ) {}

  async create(
    mentee: UserDocument,
    mentorId: string,
    dto: CreateBookingDto,
  ): Promise<ActionResult> {
    if (!hasUserRole(mentee, "mentee")) {
      throw new ForbiddenException("Only mentees can create bookings");
    }
    if (!Types.ObjectId.isValid(mentorId)) {
      throw new BadRequestException("Invalid mentor ID");
    }
    const menteeId = String(mentee._id);
    if (mentorId === menteeId) {
      throw new BadRequestException(
        "Mentor and mentee cannot be the same person",
      );
    }
    const mentor = await this.users.exists({ _id: mentorId, role: "mentor" });
    if (!mentor) throw new NotFoundException("Mentor not found");

    const date = this.parseDate(dto.date);
    const start = this.parseTime(dto.start);
    const end = this.parseTime(dto.end);
    if (start.minutes >= end.minutes) {
      throw new BadRequestException("Invalid time range");
    }
    if (this.at(date, start.minutes) <= new Date()) {
      throw new BadRequestException("Cannot book a past time slot");
    }

    const result = await this.connection.transaction(async (session) => {
      const overlap = await this.bookings.exists({
        mentee: menteeId,
        date,
        status: { $in: ["pending", "active"] },
        start: { $lt: end.value },
        end: { $gt: start.value },
      }).session(session);
      if (overlap) {
        throw new BadRequestException(
          "You already have a booking that overlaps this time",
        );
      }

      let relationship = dto.relationship
        ? await this.relationships.findOne({
            _id: dto.relationship,
            mentor: mentorId,
            mentee: menteeId,
          }).session(session)
        : await this.relationships
            .findOne({ mentor: mentorId, mentee: menteeId })
            .session(session);
      if (!relationship) {
        relationship = new this.relationships({
          mentor: mentorId,
          mentee: menteeId,
        });
        await relationship.save({ session });
      }

      const bookingId = new Types.ObjectId();
      const availability = await this.availabilities.findOneAndUpdate(
        {
          mentor: mentorId,
          date,
          slots: {
            $elemMatch: {
              start: start.value,
              end: end.value,
              status: "open",
            },
          },
        },
        {
          $set: {
            "slots.$.status": "held",
            "slots.$.bookedBy": menteeId,
            "slots.$.bookingId": bookingId,
          },
        },
        { new: true, session },
      );
      if (!availability) {
        throw new ConflictException("Selected time slot is not available");
      }
      const slot = availability.slots.find(
        (item) => item.start === start.value && item.end === end.value,
      );
      if (!slot) throw new ConflictException("Selected time slot not found");

      const profile = await this.profiles
        .findOne({ user: new Types.ObjectId(mentorId) })
        .session(session);
      const price = Math.max(0, Math.round(profile?.sessionPrice ?? 0));
      const platformFeeAmount = Math.round(
        (price * PLATFORM_FEE_PERCENT) / 100,
      );

      const created = new this.bookings({
        _id: bookingId,
        relationship: relationship._id,
        mentor: mentorId,
        mentee: menteeId,
        status: "pending",
        date,
        start: start.value,
        end: end.value,
        notes: dto.notes,
        slotId: slot._id,
        availabilityId: availability._id,
        price,
        currency: "VND",
        platformFeePercent: PLATFORM_FEE_PERCENT,
        platformFeeAmount,
        mentorNetAmount: price - platformFeeAmount,
        paymentStatus: price > 0 ? "unpaid" : "not_required",
      });
      await created.save({ session });
      let order: OrderDocument | null = null;
      if (price > 0) {
        order = new this.orders({
          orderNumber: `BOOK-${Date.now()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
          mentee: menteeId,
          userId: menteeId,
          items: [],
          courses: [],
          booking: created._id,
          type: "booking",
          subtotalAmount: price,
          discountAmount: 0,
          amount: price,
          totalAmount: price,
          currency: "VND",
          billingInfo: {
            email: mentee.email,
            firstName: mentee.firstName,
            lastName: mentee.lastName,
            country: "Vietnam",
            address: "",
          },
          paymentInfo: { method: "pending", paymentGateway: "pending" },
          paymentMethod: "pending",
        });
        await order.save({ session });
        created.order = order._id;
        await created.save({ session });
      }
      await this.notifications.notify(
        {
          recipient: mentorId,
          actor: menteeId,
          type: "booking_created",
          title: "New booking request",
          body: "A mentee requested a mentoring session.",
          link: "/mentor-profile?tab=bookings",
          metadata: { bookingId: String(created._id) },
          eventKey: `booking:created:${String(created._id)}`,
        },
        session,
      );
      return { booking: created, order };
    });

    return { message: "Booking created successfully", ...result };
  }

  async listAll(user: UserDocument, query: Record<string, string | undefined>) {
    if (user.role !== "admin") throw new ForbiddenException();
    const filter = this.listFilter(query);
    if (query.before) {
      this.assertId(query.before);
      filter._id = { $lt: new Types.ObjectId(query.before) };
    }
    const limit = Math.min(Number(query.limit) || 50, 100);
    const items = await this.bookings
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("mentor", "firstName lastName avatarUrl jobTitle")
      .populate("mentee", "firstName lastName avatarUrl")
      .lean();
    return { items, nextCursor: items.at(-1)?._id ?? null };
  }

  listForMentor(user: UserDocument, query: Record<string, string | undefined>) {
    return this.listFor("mentor", user, query);
  }

  listForMentee(user: UserDocument, query: Record<string, string | undefined>) {
    return this.listFor("mentee", user, query);
  }

  async update(
    user: UserDocument,
    id: string,
    dto: UpdateBookingDto,
  ): Promise<BookingDocument> {
    this.assertId(id);
    if (dto.notes === undefined) {
      throw new BadRequestException("No updatable fields provided");
    }
    const booking = await this.bookings.findById(id);
    if (!booking) throw new NotFoundException("Booking not found");
    if (
      user.role !== "admin" &&
      String(booking.mentor) !== String(user._id) &&
      String(booking.mentee) !== String(user._id)
    ) {
      throw new ForbiddenException("Forbidden");
    }
    booking.notes = dto.notes;
    await booking.save();
    return booking;
  }

  async remove(user: UserDocument, id: string): Promise<ActionResult> {
    if (user.role !== "admin") {
      throw new ForbiddenException("Only admin can delete bookings");
    }
    this.assertId(id);
    return this.connection.transaction(async (session) => {
      const booking = await this.bookings.findById(id).session(session);
      if (!booking) throw new NotFoundException("Booking not found");
      if (["pending", "active"].includes(booking.status)) {
        await this.releaseSlot(booking, session);
      }
      await booking.deleteOne({ session });
      return { message: "Booking deleted", booking };
    });
  }

  confirm(
    user: UserDocument,
    id: string,
    meetingLink?: string,
  ): Promise<ActionResult> {
    return this.changeByMentor(
      user,
      id,
      "active",
      "Booking confirmed",
      undefined,
      meetingLink,
    );
  }

  decline(
    user: UserDocument,
    id: string,
    reason?: string,
  ): Promise<ActionResult> {
    return this.changeByMentor(
      user,
      id,
      "rejected",
      "Booking declined",
      reason,
    );
  }

  async cancel(
    user: UserDocument,
    id: string,
    reason?: string,
  ): Promise<ActionResult> {
    this.assertId(id);
    const userId = String(user._id);
    return this.connection.transaction(async (session) => {
      const booking = await this.bookings.findById(id).session(session);
      if (!booking) throw new NotFoundException("Booking not found");
      if (
        String(booking.mentor) !== userId &&
        String(booking.mentee) !== userId
      ) {
        throw new ForbiddenException("Forbidden");
      }
      assertBookingTransition(booking.status, "cancelled");
      if (booking.status === "active" && this.startAt(booking) <= new Date()) {
        throw new BadRequestException("Cannot cancel after session start");
      }

      await this.releaseSlot(booking, session);
      if (booking.paymentStatus === "paid") {
        const isMentor = String(booking.mentor) === userId;
        const hoursUntilStart =
          (this.startAt(booking).getTime() - Date.now()) / 3_600_000;
        const refundRate = isMentor || hoursUntilStart >= 24 ? 1 : 0.5;
        booking.refundAmount = Math.round(booking.price * refundRate);
        booking.paymentStatus = "refund_pending";
        const retained = booking.price - booking.refundAmount;
        const fee = Math.round(
          (retained * booking.platformFeePercent) / 100,
        );
        await this.earnings.updateOne(
          { booking: booking._id },
          {
            $set: {
              grossAmount: retained,
              platformFeeAmount: fee,
              netAmount: retained - fee,
              status: retained > 0 ? "pending" : "cancelled",
            },
          },
          { session },
        );
      }
      booking.status = "cancelled";
      if (reason) booking.declineReason = reason;
      await booking.save({ session });
      const recipient =
        String(booking.mentor) === userId ? booking.mentee : booking.mentor;
      await this.notifications.notify(
        {
          recipient,
          actor: userId,
          type: "booking_cancelled",
          title: "Booking cancelled",
          body: "A mentoring session was cancelled.",
          link:
            String(recipient) === String(booking.mentor)
              ? "/mentor-profile?tab=bookings"
              : "/profile?tab=bookings",
          metadata: { bookingId: String(booking._id) },
          eventKey: `booking:cancelled:${String(booking._id)}`,
        },
        session,
      );
      return { message: "Booking cancelled", booking };
    });
  }

  private async changeByMentor(
    user: UserDocument,
    id: string,
    to: "active" | "rejected",
    message: string,
    reason?: string,
    meetingLink?: string,
  ): Promise<ActionResult> {
    this.assertId(id);
    return this.connection.transaction(async (session) => {
      const booking = await this.bookings.findById(id).session(session);
      if (!booking) throw new NotFoundException("Booking not found");
      if (String(booking.mentor) !== String(user._id)) {
        throw new ForbiddenException(
          `Only the booking mentor can ${to === "active" ? "confirm" : "decline"}`,
        );
      }
      assertBookingTransition(booking.status, to);
      if (to === "active" && this.startAt(booking) <= new Date()) {
        throw new BadRequestException("Cannot confirm a past session");
      }

      const slot = await this.availabilities.updateOne(
        {
          _id: booking.availabilityId,
          slots: {
            $elemMatch: {
              _id: booking.slotId,
              status: { $in: ["held", "pending"] },
              $or: [
                { bookingId: booking._id },
                { bookingId: { $exists: false } },
              ],
            },
          },
        },
        to === "active"
          ? {
              $set: {
                "slots.$.status": "booked",
                "slots.$.bookedBy": booking.mentee,
                "slots.$.bookingId": booking._id,
              },
            }
          : {
              $set: { "slots.$.status": "open" },
              $unset: {
                "slots.$.bookedBy": "",
                "slots.$.bookingId": "",
                "slots.$.holdUntil": "",
              },
            },
        { session },
      );
      if (slot.modifiedCount !== 1) {
        throw new ConflictException("Booking slot was updated by someone else");
      }

      booking.status = to;
      if (to === "active" && meetingLink !== undefined) {
        booking.meetingLink = meetingLink;
      }
      if (to === "rejected") booking.declineReason = reason ?? "";
      await booking.save({ session });
      await this.notifications.notify(
        {
          recipient: booking.mentee,
          actor: user._id,
          type: to === "active" ? "booking_confirmed" : "booking_declined",
          title: to === "active" ? "Booking confirmed" : "Booking declined",
          body:
            to === "active"
              ? "Your mentor confirmed the session."
              : "Your mentor declined the session.",
          link: "/profile?tab=bookings",
          metadata: { bookingId: String(booking._id), reason },
          eventKey: `booking:${to === "active" ? "confirmed" : "declined"}:${String(booking._id)}`,
        },
        session,
      );
      return { message, booking };
    });
  }

  private async releaseSlot(
    booking: BookingDocument,
    session: ClientSession,
  ): Promise<void> {
    const result = await this.availabilities.updateOne(
      {
        _id: booking.availabilityId,
        slots: {
          $elemMatch: {
            _id: booking.slotId,
            status: { $in: ["held", "pending", "booked"] },
            $or: [
              { bookingId: booking._id },
              { bookingId: { $exists: false } },
            ],
          },
        },
      },
      {
        $set: { "slots.$.status": "open" },
        $unset: {
          "slots.$.bookedBy": "",
          "slots.$.bookingId": "",
          "slots.$.holdUntil": "",
        },
      },
      { session },
    );
    if (result.modifiedCount !== 1) {
      throw new ConflictException("Booking slot was updated by someone else");
    }
  }

  private async listFor(
    field: "mentor" | "mentee",
    user: UserDocument,
    query: Record<string, string | undefined>,
  ) {
    await this.finishPast(field, user._id);
    const filter = this.listFilter(query);
    filter[field] = user._id;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const population =
      field === "mentor"
        ? { path: "mentee", select: "firstName lastName email avatarUrl" }
        : { path: "mentor", select: "firstName lastName avatarUrl jobTitle" };
    const items = await this.bookings
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(population)
      .populate("order", "orderNumber status totalAmount currency")
      .lean();
    if (field === "mentee") {
      return items.map((item) => {
        if (
          item.paymentStatus === "paid" ||
          item.paymentStatus === "not_required"
        ) {
          return item;
        }
        const { meetingLink, ...safe } = item;
        void meetingLink;
        return safe;
      });
    }
    return items;
  }

  async processRefund(
    user: UserDocument,
    id: string,
    refundReference: string,
  ): Promise<ActionResult> {
    if (user.role !== "admin") throw new ForbiddenException("Admin only");
    this.assertId(id);
    return this.connection.transaction(async (session) => {
      const booking = await this.bookings.findById(id).session(session);
      if (!booking) throw new NotFoundException("Booking not found");
      if (booking.paymentStatus !== "refund_pending") {
        throw new BadRequestException("Booking has no pending refund");
      }
      const order = await this.orders.findById(booking.order).session(session);
      if (!order) throw new NotFoundException("Booking order not found");
      assertOrderTransition(order.status, "refunded");
      order.status = "refunded";
      order.notes = `Refund ${refundReference}`;
      booking.paymentStatus = "refunded";
      booking.refundReference = refundReference;
      await order.save({ session });
      await booking.save({ session });
      return { message: "Booking refund recorded", booking, order };
    });
  }

  async finish(user: UserDocument, id: string): Promise<ActionResult> {
    this.assertId(id);
    return this.connection.transaction(async (session) => {
      const booking = await this.bookings.findById(id).session(session);
      if (!booking) throw new NotFoundException("Booking not found");
      if (String(booking.mentor) !== String(user._id) && user.role !== "admin") {
        throw new ForbiddenException("Only the booking mentor can finish it");
      }
      assertBookingTransition(booking.status, "finished");
      if (this.endAt(booking) > new Date()) {
        throw new BadRequestException("Cannot finish before session end");
      }
      booking.status = "finished";
      await booking.save({ session });
      if (booking.paymentStatus === "paid") {
        await this.earnings.updateOne(
          { booking: booking._id, status: "pending" },
          { $set: { status: "eligible", eligibleAt: new Date() } },
          { session },
        );
      }
      return { message: "Booking finished", booking };
    });
  }

  private async finishPast(
    field: "mentor" | "mentee",
    userId: Types.ObjectId,
  ): Promise<void> {
    const now = new Date();
    const active = await this.bookings.find({
      [field]: userId,
      status: "active",
      date: { $lte: now },
    });
    const ids = active
      .filter((booking) => this.endAt(booking) <= now)
      .map(({ _id }) => _id);
    if (ids.length) {
      await this.bookings.updateMany(
        { _id: { $in: ids }, status: "active" },
        { $set: { status: "finished" } },
      );
      await this.earnings.updateMany(
        { booking: { $in: ids }, status: "pending" },
        { $set: { status: "eligible", eligibleAt: now } },
      );
    }
  }

  private listFilter(
    query: Record<string, string | undefined>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    for (const field of ["mentor", "mentee"] as const) {
      const value = query[field];
      if (value) {
        if (!Types.ObjectId.isValid(value)) {
          throw new BadRequestException(`Invalid ${field} ID`);
        }
        filter[field] = value;
      }
    }
    const statuses = query.status
      ?.split(",")
      .map((status) => status.trim())
      .filter(Boolean);
    if (statuses?.length) {
      const allowed = new Set([
        "pending",
        "active",
        "rejected",
        "finished",
        "cancelled",
      ]);
      const invalid = statuses.filter((status) => !allowed.has(status));
      if (invalid.length) {
        throw new BadRequestException(`Invalid status: ${invalid.join(", ")}`);
      }
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    if (query.date) {
      const date = this.parseDate(query.date);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: date, $lte: end };
    } else if (query.from || query.to) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (query.from) range.$gte = this.parseDate(query.from);
      if (query.to) {
        range.$lte = this.parseDate(query.to);
        range.$lte.setUTCHours(23, 59, 59, 999);
      }
      filter.date = range;
    }
    return filter;
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid booking id");
    }
  }

  private parseDate(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid date");
    return date;
  }

  private parseTime(value: string): { value: string; minutes: number } {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!match) throw new BadRequestException("Invalid time");
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw new BadRequestException("Invalid time");
    return {
      value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      minutes: hour * 60 + minute,
    };
  }

  private startAt(booking: BookingDocument): Date {
    const time = this.parseTime(booking.start);
    return this.at(booking.date, time.minutes);
  }

  private endAt(booking: BookingDocument): Date {
    return this.at(booking.date, this.parseTime(booking.end).minutes);
  }

  private at(date: Date, minutes: number): Date {
    const value = new Date(date);
    value.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return value;
  }
}
