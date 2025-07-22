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
    role: [{ type: String, enum: ["mentor", "mentee"] }],
    isVerified: { type: Boolean, default: false },
    verifyKey: String,
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
