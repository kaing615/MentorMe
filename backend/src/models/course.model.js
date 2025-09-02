import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    thumbnail: { type: String, default: "" }, // Ảnh khóa học
    keyLearningObjectives: { type: String }, // Thêm keyLearningObjectives
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
    language: [{ type: String }],
    duration: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    numberOfRatings: { type: Number, default: 0 },
    link: { type: String, required: true },
    lectures: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
