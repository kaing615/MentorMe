import mongoose from "mongoose";
import Availability from "../../models/availability.model.js";
import Booking from "../../models/booking.model.js";
import { appendOutboxEvent } from "../../infrastructure/outbox/write-event.js";
import { withTransaction } from "../../infrastructure/transaction.js";
import { assertBookingTransition } from "./booking-state.js";

function bookingError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function createBooking(
  command,
  {
    AvailabilityModel = Availability,
    BookingModel = Booking,
    appendEvent = appendOutboxEvent,
    transactionRunner = withTransaction,
    createId = () => new mongoose.Types.ObjectId(),
    clock = () => new Date(),
  } = {}
) {
  return transactionRunner(async (session) => {
    const bookingId = createId();
    const now = clock();
    const reservationDeadline = new Date(now.getTime() + 15 * 60 * 1000);
    const availability = await AvailabilityModel.findOneAndUpdate(
      {
        mentor: command.mentor,
        date: command.date,
        slots: {
          $elemMatch: {
            start: command.start,
            end: command.end,
            status: "open",
          },
        },
      },
      {
        $set: {
          "slots.$.status": "pending",
          "slots.$.bookedBy": command.mentee,
          "slots.$.bookingId": bookingId,
          "slots.$.holdUntil": reservationDeadline,
        },
      },
      { new: true, session }
    );
    if (!availability) {
      throw bookingError("SLOT_NOT_AVAILABLE", "Selected slot is not available");
    }

    const slot = availability.slots?.find(
      (candidate) =>
        candidate.start === command.start &&
        candidate.end === command.end &&
        String(candidate.bookingId) === String(bookingId)
    );
    if (!slot) {
      throw bookingError("SLOT_RESERVATION_FAILED", "Reserved slot was not returned");
    }

    const [booking] = await BookingModel.create(
      [
        {
          _id: bookingId,
          relationship: command.relationship,
          mentor: command.mentor,
          mentee: command.mentee,
          date: command.date,
          start: command.start,
          end: command.end,
          notes: command.notes,
          status: "pending",
          slotId: slot._id,
          availabilityId: availability._id,
          reservationDeadline,
          aggregateVersion: 1,
        },
      ],
      { session }
    );
    await appendEvent(
      {
        eventType: "booking.created",
        aggregateId: bookingId,
        aggregateVersion: 1,
        payload: {
          bookingId: String(bookingId),
          mentorId: String(command.mentor),
          menteeId: String(command.mentee),
          reservationDeadline,
        },
      },
      { session }
    );
    return booking.toObject ? booking.toObject() : booking;
  });
}

const EVENT_BY_STATUS = {
  active: "booking.confirmed",
  rejected: "booking.cancelled",
  cancelled: "booking.cancelled",
  finished: "booking.finished",
};

export async function transitionBooking(
  { bookingId, targetStatus, reason },
  {
    AvailabilityModel = Availability,
    BookingModel = Booking,
    appendEvent = appendOutboxEvent,
    transactionRunner = withTransaction,
  } = {}
) {
  return transactionRunner(async (session) => {
    const pendingQuery = BookingModel.findById(bookingId);
    const current = pendingQuery?.session
      ? await pendingQuery.session(session)
      : await pendingQuery;
    if (!current) throw bookingError("BOOKING_NOT_FOUND", "Booking not found");
    assertBookingTransition(current.status, targetStatus);

    const nextVersion = (current.aggregateVersion || 1) + 1;
    const updated = await BookingModel.findOneAndUpdate(
      { _id: bookingId, status: current.status },
      {
        $set: {
          status: targetStatus,
          ...(reason ? { cancellationReason: reason } : {}),
        },
        $inc: { aggregateVersion: 1 },
      },
      { new: true, session }
    );
    if (!updated) {
      throw bookingError(
        "BOOKING_CONCURRENT_UPDATE",
        "Booking changed while the transition was being applied"
      );
    }

    const releasing = new Set(["rejected", "cancelled"]).has(targetStatus);
    const slotUpdate = releasing
      ? {
          $set: {
            "slots.$.status": "open",
            "slots.$.bookedBy": null,
            "slots.$.bookingId": null,
            "slots.$.holdUntil": null,
          },
        }
      : {
          $set: {
            "slots.$.status": "booked",
            "slots.$.holdUntil": null,
          },
        };
    if (targetStatus !== "finished") {
      const slotResult = await AvailabilityModel.updateOne(
        { _id: current.availabilityId, "slots._id": current.slotId },
        slotUpdate,
        { session }
      );
      if (
        slotResult.modifiedCount !== undefined &&
        slotResult.modifiedCount !== 1
      ) {
        throw bookingError(
          "SLOT_UPDATE_FAILED",
          "Booking slot could not be updated"
        );
      }
    }

    await appendEvent(
      {
        eventType: EVENT_BY_STATUS[targetStatus],
        aggregateId: bookingId,
        aggregateVersion: nextVersion,
        payload: {
          bookingId: String(bookingId),
          mentorId: String(current.mentor),
          menteeId: String(current.mentee),
          status: targetStatus,
          reason,
        },
      },
      { session }
    );
    return updated.toObject ? updated.toObject() : updated;
  });
}
