import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  start: { type: String, required: true }, 
  end:   { type: String, required: true }, 
  status: {
    type: String,
    enum: ["open", "held", "booked", "blocked"],
    default: "open"
  },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  holdUntil: { type: Date }, 
}, { _id: true });

const AvailabilitySchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date:   { type: Date, required: true, index: true }, 
  timezone: { type: String, default: "Asia/Ho_Chi_Minh" },
  slots: [SlotSchema],
}, { timestamps: true });

AvailabilitySchema.index({ mentor: 1, date: 1 }, { unique: true }); 

export default mongoose.model("Availability", AvailabilitySchema);