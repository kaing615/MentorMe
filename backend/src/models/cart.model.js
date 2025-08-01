import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    discountCode: {
        type: String,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Middleware để tự động tính finalAmount
cartSchema.pre('save', function(next) {
    this.finalAmount = this.totalAmount - this.discountAmount;
    next();
});

// Index để tìm cart theo userId nhanh hơn
cartSchema.index({ userId: 1 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
