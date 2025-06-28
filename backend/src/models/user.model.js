import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    userName: String,
    firstName: String,
    lastName: String,
    password: String, 
    googleId: String,
    avatar: String,
    location: String,
    role: [{ type: String, enum: ["mentor", "mentee"] }],
    isVerified: { type: Boolean, default: false },
    verifyKey: String,
}, { timestamps: true });

export default mongoose.model("user", UserSchema);
