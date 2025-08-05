import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
<<<<<<< HEAD
    title: { type: String, required: true },
    courseOverview: { type: String, required: true },
    keyLearningObjectives: { type: String, required: true },
=======
    name: { type: String, required: true }, // Đổi từ 'title' thành 'name'
    description: { type: String, required: true },
    shortDescription: { type: String }, // Thêm shortDescription
    thumbnail: { type: String }, // Thêm thumbnail
>>>>>>> feature/courseCreate-BE
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
<<<<<<< HEAD
    level: { 
      type: String, 
      required: true,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    tags: [{ type: String }],
    duration: { type: Number, required: false }, // Optional field
    rate: { type: Number, default: 0 },
    link: { type: String, required: false }, // Optional meeting/course link
    driveLink: { type: String, required: true }, // Google Drive link for materials
    lectures: { type: Number, required: true },
=======
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true }, // Thêm level field
    tags: [{ type: String }],
    duration: { type: Number }, // duration có thể không bắt buộc lúc tạo?
    rate: { type: Number, default: 0 }, // Sử dụng 'rate' cho averageRating
    numberOfRatings: { type: Number, default: 0 }, // Thêm numberOfRatings
    link: { type: String }, // link có thể không bắt buộc lúc tạo?
    lectures: { type: Number }, // lectures có thể không bắt buộc lúc tạo?
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }], // Thêm lessons
>>>>>>> feature/courseCreate-BE
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
