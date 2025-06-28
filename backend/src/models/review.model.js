import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  content: String,
  rate: Number,
  sentAt: { type: Date, default: Date.now }
});

export default mongoose.model("review", ReviewSchema);
