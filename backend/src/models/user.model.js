import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      min: 6,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
    },
<<<<<<< HEAD
    avatar: String,
    location: String,
    role: [{ type: String, enum: ["mentor", "mentee"] }],
=======
    avatarUrl: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
    jobTitle: { type: String },
    location: { type: String },
    category: { type: String },
    skills: [{ type: String }],
    bio: { type: String },
    linkedinUrl: { type: String },
    introVideo: { type: String },
    mentorReason: { type: String },
    greatestAchievement: { type: String },
    role: { type: String, enum: ["mentor", "mentee", "admin"] },
>>>>>>> 0e92a0b1b0aa6b6f0df3f429a0d7adecbc27d9a5
    isVerified: { type: Boolean, default: false },
    verifyKey: String,
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
    wishlist: [{ type: mongoose.Schema.ObjectId, ref: "Course" }],
    purchasedCourses: [
      {
        course: {
          type: mongoose.Schema.ObjectId,
          ref: "Course",
          required: true,
        },
        purchaseDate: { type: Date, default: Date.now },
        orderId: { type: mongoose.Schema.ObjectId, ref: "Order" },
        progress: { type: Number, default: 0, min: 0, max: 100 }, // Tiến độ học (%)
        lastAccessDate: { type: Date, default: Date.now },
        isCompleted: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
