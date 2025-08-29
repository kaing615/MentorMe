import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import RelationShip from "../models/relationship.model.js";
import Notification from "../models/notification.model.js";
import Availability from "../models/availability.model.js";
import responseHandler from "../handlers/response.handler.js";
import mongoose from "mongoose";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function isValidHHMM(s) {
  return /^\d{2}:\d{2}$/.test(s);
}

const normalizeHHMM = (s) => {
  const [h, m] = String(s).split(":");
  const hh = String(parseInt(h, 10)).padStart(2, "0");
  const mm = String(parseInt(m, 10)).padStart(2, "0");
  return `${hh}:${mm}`;
};

const toStatusCond = (status) => {
  if (!status) return undefined;
  let list = status;
  if (typeof status === "string") {
    list = status.includes(",") ? status.split(",").map(s => s.trim()) : [status];
  }
  return list.length === 1 ? list[0] : { $in: list };
};

function combineDateAndTime(date, hhmm) {
  const [h = 0, m = 0] = String(hhmm).split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export const getBookings = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return (
        responseHandler.unauthorized?.(res) || responseHandler.forbidden(res)
      );
    }

    const {
      mentor,
      mentee,
      date,
      from,
      to,
      status,
      before,
      limit = 50,
    } = req.query;

    const q = {};
    const lim = Math.min(parseInt(limit, 10) || 50, 100);

    if (mentor) {
      if (!mongoose.Types.ObjectId.isValid(mentor)) {
        return responseHandler.badRequest(res, "Invalid mentor ID");
      }
      q.mentor = mentor;
    }

    if (mentee) {
      if (!mongoose.Types.ObjectId.isValid(mentee)) {
        return responseHandler.badRequest(res, "Invalid mentee ID");
      }
      q.mentee = mentee;
    }

    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime()))
        return responseHandler.badRequest(res, "Invalid date");
      q.date = { $gte: startOfDay(d), $lte: endOfDay(d) };
    } else if (from || to) {
      const cond = {};
      if (from) {
        const f = new Date(from);
        if (isNaN(f.getTime()))
          return responseHandler.badRequest(res, "Invalid from date");
        cond.$gte = startOfDay(f);
      }
      if (to) {
        const t = new Date(to);
        if (isNaN(t.getTime()))
          return responseHandler.badRequest(res, "Invalid to date");
        cond.$lte = endOfDay(t);
      }
      if (Object.keys(cond).length) q.date = cond;
    }

    const allowed = new Set([
      "pending",
      "active",
      "rejected",
      "finished",
      "cancelled",
    ]);
    if (status) {
      let list = status;
      if (typeof status === "string") {
        list = status.includes(",")
          ? status.split(",").map((s) => s.trim())
          : [status];
      }
      const invalid = list.filter((s) => !allowed.has(s));
      if (invalid.length) {
        return responseHandler.badRequest(
          res,
          `Invalid status: ${invalid.join(", ")}`
        );
      }
      q.status = list.length === 1 ? list[0] : { $in: list };
    }

    if (before) {
      if (!mongoose.Types.ObjectId.isValid(before)) {
        return responseHandler.badRequest(res, "Invalid cursor");
      }
      q._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const items = await Booking.find(q)
      .sort({ _id: -1 })
      .limit(lim)
      .populate("mentor", "firstName lastName avatarUrl jobTitle")
      .populate("mentee", "firstName lastName avatarUrl")
      .lean();

    const nextCursor = items.length ? items[items.length - 1]._id : null;

    return responseHandler.ok(res, {
      items,
      nextCursor,
    });
  } catch (err) {
    console.error("getBookings Error: ", err);
    return responseHandler.error(res, err);
  }
};

export const getBookingsOfMentor = async (req, res) => {
  try {
    const mentor = req.user?._id || req.user?.id;
    if (!mentor)
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );

    const { date, status, limit = 10 } = req.query;
    const query = { mentor };

    if (date) {
      const day = new Date(date);
      if (isNaN(day.getTime()))
        return responseHandler.badRequest(res, "Invalid date");
      query.date = { $gte: startOfDay(day), $lte: endOfDay(day) };
    }

    const s = toStatusCond(status);
    if (s) query.status = s;

    const lim = Math.min(Number(limit) || 10, 100);

    const bookings = await Booking.find(query)
      .sort({ date: -1, start: 1 })
      .limit(lim)
      .populate("mentee", "firstName lastName avatarUrl");

    return responseHandler.ok(res, bookings);
  } catch (err) {
    console.error("getBookingsOfMentor Error: ", err);
    return responseHandler.error(res, err);
  }
};

export const getBookingsOfMentee = async (req, res) => {
  try {
    const mentee = req.user?._id || req.user?.id;
    if (!mentee)
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );

    const { date, status, limit = 10 } = req.query;
    const query = { mentee };

    if (date) {
      const day = new Date(date);
      if (isNaN(day.getTime()))
        return responseHandler.badRequest(res, "Invalid date");
      query.date = { $gte: startOfDay(day), $lte: endOfDay(day) };
    }

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    const lim = Math.min(Number(limit) || 10, 100);

    const bookings = await Booking.find(query)
      .sort({ date: -1, start: 1 })
      .limit(lim)
      .populate("mentor", "firstName lastName avatarUrl jobTitle");

    return responseHandler.ok(res, bookings);
  } catch (err) {
    console.error("getBookingsOfMentee Error: ", err);
    return responseHandler.error(res, err);
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const booking = await Booking.findByIdAndUpdate(id, update, { new: true });
    if (!booking) return responseHandler.notFound(res, "Booking not found");
    return responseHandler.ok(res, booking);
  } catch (err) {
    responseHandler.error(res, err);
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return responseHandler.notFound(res, "Booking not found");
    return responseHandler.ok(res, { message: "Booking deleted" });
  } catch (err) {
    responseHandler.error(res, err);
  }
};

export const createBooking = async (req, res) => {
  try {
    const mentee = req.user?.id || req.user?._id;
    const mentor =
      req.params.mentorId ||
      req.params.id ||
      req.params.mentor ||
      req.body.mentor;

    const { date, start, end, notes, relationship: relationshipId } = req.body;

    if (!mentor || !mentee || !date || !start || !end) {
      return responseHandler.badRequest(
        res,
        "Missing required fields (mentor, date, start, end)"
      );
    }
    if (!normalizeHHMM(start) || !normalizeHHMM(end) || start >= end) {
      return responseHandler.badRequest(
        res,
        "Invalid time range (start/end must be HH:mm and start < end)"
      );
    }
    if (mentor === mentee) {
      return responseHandler.badRequest(
        res,
        "Mentor và mentee không thể là cùng một người"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(mentor)) {
      return responseHandler.badRequest(res, "Invalid mentor ID");
    }

    const [mentorExists, menteeExists] = await Promise.all([
      User.findById(mentor).lean(),
      User.findById(mentee).lean(),
    ]);

    if (!mentorExists || !menteeExists) {
      return responseHandler.notFound(res, "User not found");
    }

    let relationship = relationshipId;
    if (!relationship) {
      const rel = await RelationShip.findOne({ mentee, mentor }).lean();
      relationship = rel ? rel._id ?? null : null;
    }

    const day = new Date(date);
    const conflict = await Booking.findOne({
      mentor,
      date: { $gte: startOfDay(day), $lte: endOfDay(day) },
      status: { $in: ["pending", "active"] },
      start: { $lt: end },
      end: { $gt: start },
    }).lean();

    if (conflict) {
      return responseHandler.badRequest(res, "Booking conflict detected");
    }

    const dayKey = new Date(day);
    dayKey.setHours(0, 0, 0, 0);
    const avail = await Availability.findOneAndUpdate(
      {
        mentor,
        date: dayKey,
        "slots.start": start,
        "slots.end": end,
        "slots.status": "open",
      },
      {
        $set: {
          "slots.$.status": "booked",
          "slots.$.bookedBy": mentee,
        },
      },
      { new: true }
    );

    if (!avail) {
      return responseHandler.badRequest(
        res,
        "Selected time slot is not available"
      );
    }

    const booking = await Booking.create({
      relationship,
      mentor,
      mentee,
      date: dayKey,
      start,
      end,
      notes,
      status: "pending",
    });

    await Availability.updateOne(
      { _id: avail._id, "slots.start": start, "slots.end": end },
      { $set: { "slots.$.bookingId": booking._id } }
    );

    const menteeName =
      `${menteeExists.firstName} ${menteeExists.lastName}`.trim();

    try {
      await Notification.create({
        userId: new mongoose.Types.ObjectId(mentor),
        type: "booking.requested",
        title: `New booking requested by ${menteeName}`,
        body: `${menteeName}: ${start} - ${end} on ${dayKey.toLocaleDateString(
          "vi-VN"
        )}`,
        data: {
          bookingId: booking._id.toString(),
          mentorId: mentor,
          menteeId: mentee,
          menteeName,
          startAt: new Date(
            new Date(day).setHours(
              Number(start.slice(0, 2)),
              Number(start.slice(3)),
              0,
              0
            )
          ),
          endAt: new Date(
            new Date(day).setHours(
              Number(end.slice(0, 2)),
              Number(end.slice(3)),
              0,
              0
            )
          ),
        },
        sourceType: "booking",
        sourceId: booking._id.toString(),
        deliverAt: new Date(),
        deduplicationKey: `${booking._id.toString()}:requested`,
      });
    } catch (err) {
      if (err?.code === 11000) {
        console.error("[Notification] Duplicate notification:", err);
      }
    }

    return responseHandler.ok(res, {
      message: "Booking created successfully",
      booking,
    });
  } catch (err) {
    console.error(`Error creating booking: `, err);
    return responseHandler.error(res, err);
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const user = req.user;
    const userId = String(user?.id || user?._id || "");
    const { id } = req.params;

    if (!userId)
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.badRequest(res, "Invalid booking id");
    }

    const existing = await Booking.findById(id);
    if (!existing) return responseHandler.notFound(res, "Booking not found");

    const isMentor = String(existing.mentor) === String(userId);
    const isAdmin = req.user?.role === "admin";
    if (!isMentor && !isAdmin) {
      return (
        responseHandler.forbidden?.(res) ||
        responseHandler.badRequest(res, "Only mentor/admin can confirm")
      );
    }

    if (existing.status === "active") {
      return responseHandler.ok(res, {
        message: "Already confirmed",
        booking: existing,
      });
    }
    if (existing.status !== "pending") {
      return responseHandler.badRequest(
        res,
        `Cannot confirm booking with status: ${existing.status}`
      );
    }

    if (
      !existing.start ||
      !existing.end ||
      !/^\d{1,2}:\d{2}$/.test(existing.start) ||
      !/^\d{1,2}:\d{2}$/.test(existing.end)
    ) {
      return responseHandler.badRequest(res, "Invalid time window");
    }

    const startAt = new Date(existing.date);
    const [hhS, mmS] = String(existing.start).split(":").map(Number);
    startAt.setHours(hhS || 0, mmS || 0, 0, 0);
    if (startAt <= new Date()) {
      return responseHandler.badRequest(res, "Cannot confirm past session");
    }
    const endAt = new Date(existing.date);
    const [hhE, mmE] = String(existing.end).split(":").map(Number);
    endAt.setHours(hhE || 0, mmE || 0, 0, 0);

    const booking = await Booking.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "active" } },
      { new: true }
    );

    if (!booking) {
      return responseHandler.badRequest(
        res,
        "Booking was updated by someone else"
      );
    }

    const dateLabel = booking.date.toLocaleDateString("vi-VN");

    const mentor = await User.findById(existing.mentor)
      .lean()
      .select("firstName lastName");
    const mentorName = mentor
      ? `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() || "Mentor"
      : "Mentor";
    await Notification.updateOne(
      {
        userId: booking.mentee,
        deduplicationKey: `booking:${booking._id}:confirmed`,
      },
      {
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(booking.mentee),
          type: "booking.confirmed",
          title: "Lịch đã được xác nhận",
          body: `${mentorName} đã xác nhận khung ${booking.start}–${booking.end} (${dateLabel})`,
          data: {
            bookingId: booking._id.toString(),
            mentorId: String(booking.mentor),
            menteeId: String(booking.mentee),
            startAt,
            endAt,
          },
          sourceType: "booking",
          sourceId: booking._id.toString(),
          deliverAt: new Date(),
          deduplicationKey: `booking:${booking._id}:confirmed`,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    await Notification.updateOne(
      {
        userId: booking.mentor,
        deduplicationKey: `booking:${booking._id}:active`,
      },
      {
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(booking.mentor),
          type: "booking.active",
          title: "Bạn đã xác nhận lịch hẹn",
          body: `${booking.start}–${booking.end} (${dateLabel})`,
          data: {
            bookingId: booking._id.toString(),
            mentorId: String(booking.mentor),
            menteeId: String(booking.mentee),
            startAt,
            endAt,
          },
          sourceType: "booking",
          sourceId: booking._id.toString(),
          deliverAt: new Date(),
          deduplicationKey: `booking:${booking._id}:active`,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const remindAt = new Date(startAt.getTime() - 30 * 60 * 1000);
    if (remindAt > new Date()) {
      await Notification.updateOne(
        {
          userId: booking.mentor,
          deduplicationKey: `booking:${booking._id}:reminder:mentor`,
        },
        {
          $setOnInsert: {
            userId: new mongoose.Types.ObjectId(booking.mentor),
            type: "booking.reminder.mentor",
            title: "Sắp đến giờ hẹn",
            body: `${booking.start}–${booking.end} (${dateLabel})`,
            data: { bookingId: booking._id.toString(), startAt, endAt },
            sourceType: "booking",
            sourceId: booking._id.toString(),
            deliverAt: remindAt,
            expiresAt: new Date(endAt.getTime() + 60 * 60 * 1000),
            deduplicationKey: `booking:${booking._id}:reminder:mentor`,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      await Notification.updateOne(
        {
          userId: booking.mentee,
          deduplicationKey: `booking:${booking._id}:reminder:mentee`,
        },
        {
          $setOnInsert: {
            userId: new mongoose.Types.ObjectId(booking.mentee),
            type: "booking.reminder.mentee",
            title: "Sắp đến giờ hẹn",
            body: `${booking.start}–${booking.end} (${dateLabel})`,
            data: { bookingId: booking._id.toString(), startAt, endAt },
            sourceType: "booking",
            sourceId: booking._id.toString(),
            deliverAt: remindAt,
            expiresAt: new Date(endAt.getTime() + 60 * 60 * 1000),
            deduplicationKey: `booking:${booking._id}:reminder:mentee`,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return responseHandler.ok(res, { message: "Booking confirmed", booking });
  } catch (err) {
    console.error("confirmBooking error:", err);
    return responseHandler.error(res, err);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!userId) {
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );
    }

    const existing = await Booking.findById(id);
    if (!existing) return responseHandler.notFound(res, "Booking not found");

    const isMentor = String(existing.mentor) === String(userId);
    const isMentee = String(existing.mentee) === String(userId);
    const isAdmin = req.user?.role === "admin";
    if (!isMentor && !isMentee && !isAdmin) {
      return (
        responseHandler.forbidden?.(res) ||
        responseHandler.badRequest(res, "Forbidden")
      );
    }

    if (["cancelled", "finished", "rejected"].includes(existing.status)) {
      return responseHandler.ok(res, {
        message: `Booking already ${existing.status}`,
        booking: existing,
      });
    }

    const startAt = new Date(existing.date);
    const [h, m] = String(existing.start).split(":").map(Number);
    startAt.setHours(h || 0, m || 0, 0, 0);
    if (existing.status === "active" && startAt <= new Date()) {
      return responseHandler.badRequest(
        res,
        "Cannot cancel after session start"
      );
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: id, status: { $in: ["pending", "active"] } },
      { $set: { status: "cancelled" } },
      { new: true }
    );
    if (!booking) {
      return responseHandler.badRequest(res, "Booking is not cancellable");
    }

    const dayKey = startOfDay(existing.date);

    let freed = await Availability.updateOne(
      {
        mentor: existing.mentor,
        date: dayKey,
        "slots.bookingId": existing._id,
        "slots.status": { $in: ["booked", "held"] },
      },
      {
        $set: { "slots.$.status": "open" },
        $unset: {
          "slots.$.bookedBy": "",
          "slots.$.bookingId": "",
          "slots.$.holdUntil": "",
        },
      }
    );

    if (freed.matchedCount === 0 || freed.modifiedCount === 0) {
      freed = await Availability.updateOne(
        {
          mentor: existing.mentor,
          date: dayKey,
          "slots.start": existing.start,
          "slots.end": existing.end,
          "slots.status": { $in: ["booked", "held"] },
        },
        {
          $set: { "slots.$.status": "open" },
          $unset: {
            "slots.$.bookedBy": "",
            "slots.$.bookingId": "",
            "slots.$.holdUntil": "",
          },
        }
      );
      if (freed.modifiedCount === 0) {
        console.warn(
          "[cancelBooking] Slot not freed, please reconcile manually",
          { bookingId: String(existing._id) }
        );
      }
    }

    try {
      const canceller = await User.findById(userId)
        .lean()
        .select("firstName lastName");
      const cancellerName = canceller
        ? `${canceller.firstName} ${canceller.lastName}`.trim()
        : "Người dùng";
      const dateLabel = existing.date.toLocaleDateString("vi-VN");
      const otherUser = isAdmin
        ? null
        : isMentor
        ? existing.mentee
        : existing.mentor;
      const recipients = isAdmin
        ? [existing.mentor, existing.mentee]
        : [otherUser];

      for (const rid of recipients) {
        await Notification.updateOne(
          {
            userId: rid,
            deduplicationKey: `booking:${existing._id}:cancelled:${rid}`,
          },
          {
            $setOnInsert: {
              userId: new mongoose.Types.ObjectId(rid),
              type: "booking.cancelled",
              title: "Lịch đã bị huỷ",
              body: `${cancellerName} đã huỷ khung ${existing.start}–${
                existing.end
              } (${dateLabel})${reason ? ` • Lý do: ${reason}` : ""}`,
              data: {
                bookingId: existing._id.toString(),
                mentorId: String(existing.mentor),
                menteeId: String(existing.mentee),
                reason: reason || "",
              },
              sourceType: "booking",
              sourceId: existing._id.toString(),
              deliverAt: new Date(),
              deduplicationKey: `booking:${existing._id}:cancelled:${rid}`,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    } catch (e) {
      if (e?.code !== 11000) console.error("[notification cancel] error:", e);
    }

    return responseHandler.ok(res, { message: "Booking cancelled", booking });
  } catch (err) {
    console.error("cancelBooking error:", err);
    return responseHandler.error(res, err);
  }
};

export default {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
  getBookingsOfMentee,
  getBookingsOfMentor,
  confirmBooking,
  cancelBooking,
};
