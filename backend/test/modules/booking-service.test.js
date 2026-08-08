import assert from "node:assert/strict";
import test from "node:test";

test("booking service reserves an open slot exactly once", async () => {
  const module = await import(
    "../../src/modules/booking/booking.service.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createBooking, "function");

  let slotOpen = true;
  const availabilityModel = {
    async findOneAndUpdate(_query, update) {
      if (!slotOpen) return null;
      slotOpen = false;
      return {
        _id: "availability-1",
        slots: [
          {
            _id: "slot-1",
            start: "09:00",
            end: "09:30",
            status: "pending",
            bookingId: update.$set["slots.$.bookingId"],
          },
        ],
      };
    },
  };
  const bookingModel = {
    async create([input]) {
      return [{ ...input, toObject: () => input }];
    },
  };
  const dependencies = {
    AvailabilityModel: availabilityModel,
    BookingModel: bookingModel,
    appendEvent: async () => {},
    transactionRunner: async (work) => work({ id: "session-1" }),
    createId: (() => {
      let value = 0;
      return () => `id-${(value += 1)}`;
    })(),
    clock: () => new Date("2026-08-08T10:00:00.000Z"),
  };
  const command = {
    relationship: "relationship-1",
    mentor: "mentor-1",
    mentee: "mentee-1",
    date: new Date("2026-08-09T00:00:00.000Z"),
    start: "09:00",
    end: "09:30",
    notes: "Portfolio review",
  };

  const booking = await module.createBooking(command, dependencies);
  assert.equal(booking.status, "pending");
  assert.equal(booking.availabilityId, "availability-1");
  assert.equal(booking.aggregateVersion, 1);
  await assert.rejects(
    module.createBooking(command, dependencies),
    (error) => error.code === "SLOT_NOT_AVAILABLE"
  );
});

test("booking transition updates booking and slot in one transaction", async () => {
  const { transitionBooking } = await import(
    "../../src/modules/booking/booking.service.js"
  );
  const state = {
    _id: "booking-1",
    status: "pending",
    aggregateVersion: 1,
    availabilityId: "availability-1",
    slotId: "slot-1",
    mentee: "mentee-1",
    mentor: "mentor-1",
  };
  let slotStatus = "pending";
  const BookingModel = {
    async findById() {
      return { ...state };
    },
    async findOneAndUpdate(query, update) {
      if (query.status !== state.status) return null;
      state.status = update.$set.status;
      state.aggregateVersion += update.$inc.aggregateVersion;
      return { ...state };
    },
  };
  const AvailabilityModel = {
    async updateOne(_query, update) {
      slotStatus = update.$set["slots.$.status"];
      return { modifiedCount: 1 };
    },
  };
  const dependencies = {
    AvailabilityModel,
    BookingModel,
    appendEvent: async () => {},
    transactionRunner: async (work) => work({ id: "session-1" }),
  };

  const active = await transitionBooking(
    { bookingId: "booking-1", targetStatus: "active" },
    dependencies
  );
  assert.equal(active.status, "active");
  assert.equal(active.aggregateVersion, 2);
  assert.equal(slotStatus, "booked");

  const cancelled = await transitionBooking(
    { bookingId: "booking-1", targetStatus: "cancelled" },
    dependencies
  );
  assert.equal(cancelled.status, "cancelled");
  assert.equal(slotStatus, "open");
});

test("finishing an active booking keeps its slot booked", async () => {
  const { transitionBooking } = await import(
    "../../src/modules/booking/booking.service.js"
  );
  const state = {
    _id: "booking-2",
    status: "active",
    aggregateVersion: 2,
    availabilityId: "availability-1",
    slotId: "slot-2",
    mentee: "mentee-1",
    mentor: "mentor-1",
  };
  let slotWrites = 0;
  const result = await transitionBooking(
    { bookingId: state._id, targetStatus: "finished" },
    {
      BookingModel: {
        async findById() { return { ...state }; },
        async findOneAndUpdate(_query, update) {
          state.status = update.$set.status;
          state.aggregateVersion += 1;
          return { ...state };
        },
      },
      AvailabilityModel: {
        async updateOne() { slotWrites += 1; return { modifiedCount: 0 }; },
      },
      appendEvent: async () => {},
      transactionRunner: async (work) => work({ id: "session-1" }),
    }
  );
  assert.equal(result.status, "finished");
  assert.equal(slotWrites, 0);
});
