import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetType: {
      type: String,
      enum: ["Course", "Mentor", "Booking"],
      required: true,
    },
    target: { type: mongoose.Schema.Types.ObjectId, required: true },
    content: String,
    rate: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Review", ReviewSchema);
