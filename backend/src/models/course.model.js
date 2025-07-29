import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Đổi từ 'title' thành 'name'
    description: { type: String, required: true },
    shortDescription: { type: String }, // Thêm shortDescription
    thumbnail: { type: String }, // Thêm thumbnail
    price: { type: Number, required: true },
    mentors: [
      { // Đổi từ 'mentor' (số ít) thành 'mentors' (số nhiều)
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
    tags: [{ type: String }],
    duration: { type: Number }, // duration có thể không bắt buộc lúc tạo?
    rate: { type: Number, default: 0 }, // Sử dụng 'rate' cho averageRating
    numberOfRatings: { type: Number, default: 0 }, // Thêm numberOfRatings
    link: { type: String }, // link có thể không bắt buộc lúc tạo?
    lectures: { type: Number }, // lectures có thể không bắt buộc lúc tạo?
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }], // Thêm lessons
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
