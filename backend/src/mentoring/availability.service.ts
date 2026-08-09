import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { Types } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { User } from "../identity/user.schema";
import {
  Availability,
  type AvailabilitySlot,
} from "./availability.schema";
import type { AvailabilityRangeQueryDto } from "./dto/availability-range-query.dto";
import type { CreateAvailabilityDto } from "./dto/create-availability.dto";

type SlotInput = { start: string; end: string; status?: "open" | "blocked" };

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability.name)
    private readonly availabilities: Model<Availability>,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  async upsert(user: UserDocument, dto: CreateAvailabilityDto) {
    this.requireRole(user, "mentor");
    const date = this.day(dto.date);
    const today = this.today();
    if (date < today) {
      throw new BadRequestException(
        "Không thể tạo availability cho ngày trong quá khứ",
      );
    }
    if (date.getUTCFullYear() !== today.getUTCFullYear()) {
      throw new BadRequestException(
        `Chỉ có thể tạo availability trong năm ${today.getUTCFullYear()}`,
      );
    }
    const slots = this.validateSlots(dto.slots);
    let availability = await this.availabilities.findOne({
      mentor: user._id,
      date,
    });

    if (availability) {
      const reserved = availability.slots.filter((slot) =>
        ["held", "booked", "pending"].includes(slot.status),
      );
      const merged: Array<SlotInput | AvailabilitySlot> = [...slots];
      for (const slot of reserved) {
        const index = merged.findIndex((item) => item.start === slot.start);
        if (index === -1) merged.push(slot);
        else merged[index] = slot;
      }
      merged.sort((left, right) => left.start.localeCompare(right.start));
      availability.set({
        slots: merged,
        timezone: dto.timezone ?? "Asia/Ho_Chi_Minh",
      });
    } else {
      availability = new this.availabilities({
        mentor: user._id,
        date,
        timezone: dto.timezone ?? "Asia/Ho_Chi_Minh",
        slots,
      });
    }
    await availability.save();

    return {
      message: "Availability đã được tạo/cập nhật thành công",
      availability: {
        ...availability.toObject(),
        dayOfWeek: this.weekday(date),
      },
    };
  }

  async todaySchedule(user: UserDocument, value?: string) {
    this.requireRole(user, "mentor");
    const date = value ?? new Date().toISOString().slice(0, 10);
    const day = this.day(date);
    const availability = await this.availabilities.findOne({
      mentor: user._id,
      date: day,
    });
    const slots = availability?.slots ?? [];
    return {
      message: availability
        ? "Lịch trong ngày được tải thành công"
        : "Không có lịch cho ngày này",
      schedule: {
        date,
        dayOfWeek: this.weekday(day),
        mentor: this.publicMentor(user),
        timezone: availability?.timezone ?? "Asia/Ho_Chi_Minh",
        totalSlots: slots.length,
        openSlots: slots.filter(({ status }) => status === "open").length,
        blockedSlots: slots.filter(({ status }) => status === "blocked").length,
        slots: slots.map((slot) => ({
          _id: slot._id,
          start: slot.start,
          end: slot.end,
          status: slot.status,
          duration: `${this.minutes(slot.end) - this.minutes(slot.start)}m`,
          isAvailable: slot.status === "open",
        })),
      },
    };
  }

  async range(user: UserDocument, query: AvailabilityRangeQueryDto) {
    this.requireRole(user, "mentor");
    const { start, end } = this.rangeDates(query, 7);
    const availabilities = await this.availabilities
      .find({ mentor: user._id, date: { $gte: start, $lte: end } })
      .sort({ date: 1 });
    return {
      availabilities: availabilities.map((availability) => ({
        ...availability.toObject(),
        dayOfWeek: this.weekday(availability.date),
      })),
      count: availabilities.length,
    };
  }

  async overview(user: UserDocument) {
    this.requireRole(user, "mentor");
    const start = this.today();
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    const availabilities = await this.availabilities
      .find({ mentor: user._id, date: { $gte: start, $lt: end } })
      .sort({ date: 1 });
    const overview = Array.from({ length: 7 }, (_, offset) => {
      const current = new Date(start);
      current.setUTCDate(current.getUTCDate() + offset);
      const value = availabilities.find(
        ({ date }) => date.toISOString().slice(0, 10) === current.toISOString().slice(0, 10),
      );
      return {
        date: current.toISOString().slice(0, 10),
        dayOfWeek: this.weekday(current),
        hasAvailability: Boolean(value),
        slots: value?.slots ?? [],
        totalSlots: value?.slots.length ?? 0,
        availableSlots:
          value?.slots.filter(({ status }) => status === "open").length ?? 0,
        timezone: value?.timezone ?? "Asia/Ho_Chi_Minh",
      };
    });
    return {
      mentor: this.publicMentor(user),
      overview,
      period: {
        startDate: overview[0]?.date,
        endDate: overview[6]?.date,
        totalDays: 7,
      },
      summary: {
        totalDaysWithSlots: overview.filter(({ hasAvailability }) => hasAvailability).length,
        totalSlots: overview.reduce((sum, item) => sum + item.totalSlots, 0),
        totalAvailableSlots: overview.reduce(
          (sum, item) => sum + item.availableSlots,
          0,
        ),
      },
    };
  }

  async mySchedules(user: UserDocument) {
    this.requireRole(user, "mentor");
    const availabilities = await this.availabilities
      .find({ mentor: user._id })
      .sort({ date: 1 });
    const months = new Map<string, unknown[]>();
    for (const availability of availabilities) {
      const date = availability.date.toISOString().slice(0, 10);
      const month = date.slice(0, 7);
      const schedules = months.get(month) ?? [];
      schedules.push({
        _id: availability._id,
        date,
        dayOfWeek: this.weekday(availability.date),
        timezone: availability.timezone,
        totalSlots: availability.slots.length,
        openSlots: availability.slots.filter(({ status }) => status === "open").length,
        bookedSlots: availability.slots.filter(({ status }) => status === "booked").length,
        blockedSlots: availability.slots.filter(({ status }) => status === "blocked").length,
        slots: availability.slots,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
        status: availability.date < new Date() ? "past" : "upcoming",
        canDelete: availability.slots.every(
          ({ status }) => !["held", "booked", "pending"].includes(status),
        ),
      });
      months.set(month, schedules);
    }
    const schedulesByMonth = [...months.entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([month, schedules]) => ({
        month,
        monthName: new Date(`${month}-01`).toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
        }),
        schedules,
      }));
    const now = new Date();
    return {
      mentor: this.publicMentor(user),
      schedulesByMonth,
      summary: {
        totalSchedules: availabilities.length,
        upcomingSchedules: availabilities.filter(({ date }) => date >= now).length,
        pastSchedules: availabilities.filter(({ date }) => date < now).length,
        totalSlots: availabilities.reduce((sum, item) => sum + item.slots.length, 0),
        totalOpenSlots: availabilities.reduce(
          (sum, item) =>
            sum + item.slots.filter(({ status }) => status === "open").length,
          0,
        ),
      },
    };
  }

  async remove(user: UserDocument, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid availability id");
    }
    const availability = await this.availabilities.findById(id);
    if (!availability) throw new NotFoundException("Availability không tồn tại");
    if (String(availability.mentor) !== String(user._id)) {
      throw new ForbiddenException(
        "Bạn không có quyền xóa availability này",
      );
    }
    if (
      availability.slots.some(({ status }) =>
        ["held", "booked", "pending"].includes(status),
      )
    ) {
      throw new BadRequestException(
        "Không thể xóa ngày có slot đang booked/held",
      );
    }
    await availability.deleteOne();
    return { message: "Availability đã được xóa thành công" };
  }

  async publicAvailability(mentorId: string, query: AvailabilityRangeQueryDto) {
    if (!Types.ObjectId.isValid(mentorId)) {
      throw new NotFoundException("Mentor không tồn tại");
    }
    const mentor = await this.users.findOne({ _id: mentorId, role: "mentor" });
    if (!mentor) throw new NotFoundException("Mentor không tồn tại");
    const { start, end } = this.rangeDates(query, 14);
    const availabilities = await this.availabilities
      .find({ mentor: mentorId, date: { $gte: start, $lte: end } })
      .sort({ date: 1 });
    return {
      mentor: this.publicMentor(mentor),
      availabilities: availabilities.map((availability) => ({
        _id: availability._id,
        date: availability.date.toISOString().slice(0, 10),
        dayOfWeek: this.weekday(availability.date),
        timezone: availability.timezone,
        slots: availability.slots.map(({ _id, start, end, status }) => ({
          _id,
          start,
          end,
          status,
        })),
      })),
      count: availabilities.length,
      period: {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      },
    };
  }

  async deleteOlderThan(daysBack: number) {
    if (!Number.isInteger(daysBack) || daysBack < 0) {
      throw new BadRequestException("daysBack must be a non-negative integer");
    }
    const cutoff = this.today();
    cutoff.setUTCDate(cutoff.getUTCDate() - daysBack);
    const result = await this.availabilities.deleteMany({ date: { $lt: cutoff } });
    return {
      message: "Cleanup completed successfully",
      deletedCount: result.deletedCount,
      cutoffDate: cutoff.toISOString().slice(0, 10),
      daysBack,
      timestamp: new Date(),
    };
  }

  private validateSlots(slots: SlotInput[]): SlotInput[] {
    const normalized = slots
      .map((slot) => {
        const start = this.normalizeTime(slot.start);
        const end = this.normalizeTime(slot.end);
        if (this.minutes(end) - this.minutes(start) !== 30) {
          throw new BadRequestException(
            "Mỗi slot phải có thời gian chính xác 30 phút",
          );
        }
        if (this.minutes(start) < 360 || this.minutes(end) > 1320) {
          throw new BadRequestException("Slot phải nằm trong khoảng 06:00-22:00");
        }
        return { start, end, status: slot.status ?? "open" };
      })
      .sort((left, right) => left.start.localeCompare(right.start));
    for (let index = 1; index < normalized.length; index += 1) {
      const previous = normalized[index - 1];
      const current = normalized[index];
      if (previous && current && previous.end > current.start) {
        throw new BadRequestException(
          `Slots trùng giờ: ${previous.start}-${previous.end} và ${current.start}-${current.end}`,
        );
      }
    }
    return normalized;
  }

  private normalizeTime(value: string): string {
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (hour > 23 || minute > 59) throw new BadRequestException("Invalid time");
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  private minutes(value: string): number {
    const [hour = 0, minute = 0] = value.split(":").map(Number);
    return hour * 60 + minute;
  }

  private day(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid date");
    return date;
  }

  private today(): Date {
    return this.day(new Date().toISOString().slice(0, 10));
  }

  private rangeDates(
    query: AvailabilityRangeQueryDto,
    defaultDays: number,
  ): { start: Date; end: Date } {
    const start = this.day(
      query.startDate ?? new Date().toISOString().slice(0, 10),
    );
    const end = query.endDate ? this.day(query.endDate) : new Date(start);
    if (!query.endDate) end.setUTCDate(end.getUTCDate() + defaultDays);
    if (start > end) {
      throw new BadRequestException("startDate không thể lớn hơn endDate");
    }
    return { start, end };
  }

  private requireRole(user: UserDocument, role: "mentor" | "admin"): void {
    if (user.role !== role) throw new ForbiddenException();
  }

  private publicMentor(user: UserDocument) {
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle,
    };
  }

  private weekday(date: Date): string {
    return date.toLocaleDateString("vi-VN", { weekday: "long" });
  }
}
