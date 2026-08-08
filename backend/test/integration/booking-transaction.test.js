import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import Availability from "../../src/models/availability.model.js";
import Booking from "../../src/models/booking.model.js";
import OutboxEvent from "../../src/infrastructure/outbox/outbox.model.js";
import { createBooking } from "../../src/modules/booking/booking.service.js";

const mongoUrl = process.env.MONGO_TEST_URL;

test(
  "MongoDB transaction permits one slot winner and rolls back event failures",
  { skip: !mongoUrl },
  async () => {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
    try {
      await Promise.all([
        Availability.syncIndexes(),
        Booking.syncIndexes(),
        OutboxEvent.syncIndexes(),
      ]);
      await Promise.all([
        Availability.deleteMany({}),
        Booking.deleteMany({}),
        OutboxEvent.deleteMany({}),
      ]);

      const mentor = new mongoose.Types.ObjectId();
      const mentee = new mongoose.Types.ObjectId();
      const relationship = new mongoose.Types.ObjectId();
      const date = new Date("2026-08-09T00:00:00.000Z");
      await Availability.create({
        mentor,
        date,
        slots: [
          { start: "09:00", end: "09:30", status: "open" },
          { start: "10:00", end: "10:30", status: "open" },
        ],
      });
      const command = {
        mentor,
        mentee,
        relationship,
        date,
        start: "09:00",
        end: "09:30",
      };

      const outcomes = await Promise.allSettled([
        createBooking(command),
        createBooking(command),
      ]);
      assert.equal(outcomes.filter((result) => result.status === "fulfilled").length, 1);
      assert.equal(outcomes.filter((result) => result.status === "rejected").length, 1);
      assert.equal(await Booking.countDocuments({}), 1);
      assert.equal(await OutboxEvent.countDocuments({}), 1);

      await assert.rejects(
        createBooking(
          { ...command, start: "10:00", end: "10:30" },
          { appendEvent: async () => { throw new Error("forced outbox failure"); } }
        ),
        /forced outbox failure/
      );
      const availability = await Availability.findOne({ mentor, date }).lean();
      assert.equal(
        availability.slots.find((slot) => slot.start === "10:00").status,
        "open"
      );
      assert.equal(await Booking.countDocuments({ start: "10:00" }), 0);
    } finally {
      await mongoose.disconnect();
    }
  }
);
