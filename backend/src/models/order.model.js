import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    type: { type: String, enum: ["course", "booking"], required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank", "momo", "paypal", "stripe", "cash"],
      default: "bank",
    },
    transactionId: String,
    note: String,
  },
  { timestamps: true }
);
