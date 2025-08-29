<<<<<<< HEAD
import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi user chỉ có 1 cart
    },
    courses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

CartSchema.index({ "courses.course": 1 });
// Index for better performance
CartSchema.index({ "courses.course": 1 });

export default mongoose.model("Cart", CartSchema);
=======
import mongoose, { Mongoose } from "mongoose";

const CartSchema = new Mongoose.Schema ({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    products: [
        {
            course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
            quantity: { type: number, default: 1, min: 1 },
        }
    ],
    totalPrice: { type: number, required: true, default: 0 },
})

export default mongoose.model("Cart", CartSchema);
>>>>>>> adc98f8ca68377b9d5dec2a4335bcca588d1c7ac
