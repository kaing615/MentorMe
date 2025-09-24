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
ReviewSchema.index(
  { author: 1, targetType: 1, target: 1 }, 
  { unique: true }
);

ReviewSchema.index(
  { targetType: 1, target: 1, createdAt: -1 }
);



export default mongoose.model("Review", ReviewSchema);