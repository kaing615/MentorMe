import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  relationship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Relationship",
    required: true,
  },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "active", "rejected", "finished", "cancelled"],
    default: "pending",
  },
  date: Date,
  start: String,
  end: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Availability.slots._id",
  },
});

BookingSchema.index(
  { mentor: 1, dateKey: 1, start: 1, end: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "active"] } },
  }
);

BookingSchema.index(
  { mentee: 1, dateKey: 1, start: 1, end: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "active"] } },
  }
);

export default mongoose.model("Booking", BookingSchema);
