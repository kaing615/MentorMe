import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseOverview: { type: String, required: true },
    keyLearningObjectives: { type: String, required: true },
    price: { type: Number, required: true },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
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
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
