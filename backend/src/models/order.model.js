import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    thumbnail: {
        type: String,
        default: ""
    }
});

const billingInfoSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: "Vietnam"
    },
    address: {
        type: String,
        default: ""
    }
});

const paymentInfoSchema = new mongoose.Schema({
    method: {
        type: String,
        enum: ["credit_card", "paypal", "vnpay", "momo", "bank_transfer"],
        required: true
    },
    transactionId: {
        type: String,
        default: ""
    },
    paymentGateway: {
        type: String,
        enum: ["stripe", "paypal", "vnpay", "momo", "manual"],
        default: "manual"
    },
    paidAt: {
        type: Date
    },
    paymentData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    
    mentee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    items: [orderItemSchema],

    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    type: { type: String, enum: ["course", "booking"], default: "course" },

    subtotalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discountCode: {
        type: String,
        default: ""
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    amount: { type: Number, required: true },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    billingInfo: billingInfoSchema,
    paymentInfo: paymentInfoSchema,
    paymentMethod: {
        type: String,
        enum: ["bank", "momo", "paypal", "stripe", "cash", "credit_card", "vnpay", "bank_transfer"],
        default: "bank",
    },
    transactionId: String,
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
