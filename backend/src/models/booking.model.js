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
});

export default mongoose.model("Booking", BookingSchema);
