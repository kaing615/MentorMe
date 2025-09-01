import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    keyLearningObjectives: { type: String },
    price: { type: Number, required: true },

    // Thumbnail fields
    thumbnail: { type: String, default: "" },
    thumbnailPublicId: { type: String, default: "" },

    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Category as single string, not array
    category: { type: String, required: true },
    tags: [{ type: String }],
    language: [{ type: String }],
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    },

    duration: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    numberOfRatings: { type: Number, default: 0 },

    link: { type: String, required: true },
    lectures: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
