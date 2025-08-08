import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnailUrl: { type: String, required: true },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: [{ type: String, required: true }],
    tags: [{ type: String }],
    duration: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    link: { type: String, required: true },
    lectures: { type: Number, required: true },
    language: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
