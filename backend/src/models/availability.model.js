import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  slots: [
    {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
  ],
});
