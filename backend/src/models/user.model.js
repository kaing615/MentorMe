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
    avatar: String,
    location: String,
    role: [{ type: String, enum: ["mentor", "mentee"] }],
    isVerified: { type: Boolean, default: false },
    verifyKey: String,
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
