import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String }, // Thêm shortDescription
    thumbnail: { type: String }, // Thêm thumbnail
    price: { type: Number, required: true },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
    tags: [{ type: String }],
    duration: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    numberOfRatings: { type: Number, default: 0 }, // Thêm numberOfRatings
    link: { type: String, required: true },
    lectures: { type: Number, required: true },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }], // Thêm lessons
    level: { type: String }, // Thêm level
    status: { type: String, default: 'published' }, // Thêm status
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
