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