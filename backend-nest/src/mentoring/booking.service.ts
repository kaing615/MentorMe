import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { ClientSession, Connection, Model } from "mongoose";
import { Types } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { User } from "../identity/user.schema";
import { Availability } from "./availability.schema";
import { Booking, type BookingDocument } from "./booking.schema";
import { assertBookingTransition } from "./booking-state";
import type { CreateBookingDto } from "./dto/create-booking.dto";
import type { UpdateBookingDto } from "./dto/update-booking.dto";
import { Relationship } from "./relationship.schema";

type ActionResult = { message: string; booking: BookingDocument };

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
  ) {}

  async create(
    mentee: UserDocument,
    mentorId: string,
    dto: CreateBookingDto,
  ): Promise<ActionResult> {
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

    const booking = await this.connection.transaction(async (session) => {
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
      });
      await created.save({ session });
      return created;
    });

    return { message: "Booking created successfully", booking };
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

  confirm(user: UserDocument, id: string): Promise<ActionResult> {
    return this.changeByMentor(user, id, "active", "Booking confirmed");
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
      booking.status = "cancelled";
      if (reason) booking.declineReason = reason;
      await booking.save({ session });
      return { message: "Booking cancelled", booking };
    });
  }

  private async changeByMentor(
    user: UserDocument,
    id: string,
    to: "active" | "rejected",
    message: string,
    reason?: string,
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
      if (to === "rejected") booking.declineReason = reason ?? "";
      await booking.save({ session });
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
    const filter = this.listFilter(query);
    filter[field] = user._id;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const population =
      field === "mentor"
        ? { path: "mentee", select: "firstName lastName email avatarUrl" }
        : { path: "mentor", select: "firstName lastName avatarUrl jobTitle" };
    return this.bookings
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(population);
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
    const value = new Date(booking.date);
    value.setUTCHours(Math.floor(time.minutes / 60), time.minutes % 60, 0, 0);
    return value;
  }
}
