import mongoose from "mongoose";

// Schema cho order items
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

// Schema cho billing info
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

// Schema cho payment info
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

// Main Order Schema
const OrderSchema = new mongoose.Schema({
    // Order identification
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    
    // User reference (keeping mentee for backward compatibility)
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

    // Order items (new structure)
    items: [orderItemSchema],

    // Backward compatibility
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    type: { type: String, enum: ["course", "booking"], default: "course" },

    // Pricing (enhanced)
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
    amount: { type: Number, required: true }, // Original field
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Customer info
    billingInfo: billingInfoSchema,

    // Payment details (enhanced)
    paymentInfo: paymentInfoSchema,
    
    // Original fields for backward compatibility
    paymentMethod: {
        type: String,
        enum: ["bank", "momo", "paypal", "stripe", "cash", "credit_card", "vnpay", "bank_transfer"],
        default: "bank",
    },
    transactionId: String,

    // Order status (enhanced)
    status: {
        type: String,
        enum: [
            "pending",      // Chờ thanh toán
            "processing",   // Đang xử lý thanh toán
            "paid",         // Đã thanh toán
            "completed",    // Hoàn thành (đã cấp quyền truy cập)
            "failed",       // Thanh toán thất bại
            "cancelled",    // Đã hủy
            "refunded"      // Đã hoàn tiền
        ],
        default: "pending",
    },

    // Access tracking
    coursesGranted: {
        type: Boolean,
        default: false
    },
    grantedAt: {
        type: Date
    },

    // Notes and metadata
    note: String, // Original field
    notes: {
        type: String,
        default: ""
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Refund info
    refundInfo: {
        amount: {
            type: Number,
            default: 0
        },
        reason: {
            type: String,
            default: ""
        },
        refundedAt: {
            type: Date
        },
        refundTransactionId: {
            type: String,
            default: ""
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
OrderSchema.index({ mentee: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ transactionId: 1 });
OrderSchema.index({ "paymentInfo.transactionId": 1 });

// Virtual for formatted order number
OrderSchema.virtual('formattedOrderNumber').get(function() {
    return `MTM-${this.orderNumber}`;
});

// Virtual for total items count
OrderSchema.virtual('totalItems').get(function() {
    if (this.items && this.items.length > 0) {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
    return this.courses ? this.courses.length : 0;
});

// Pre-save middleware để generate order number và sync userId
OrderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        // Generate unique order number
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderNumber = `${timestamp}-${random}`;
    }
    
    // Sync userId with mentee for consistency
    if (this.mentee && !this.userId) {
        this.userId = this.mentee;
    } else if (this.userId && !this.mentee) {
        this.mentee = this.userId;
    }
    
    // Sync totalAmount with amount for backward compatibility
    if (this.totalAmount && !this.amount) {
        this.amount = this.totalAmount;
    } else if (this.amount && !this.totalAmount) {
        this.totalAmount = this.amount;
    }
    
    next();
});

// Methods
OrderSchema.methods.markAsPaid = function(transactionId, paymentGateway = "manual") {
    this.status = "paid";
    if (this.paymentInfo) {
        this.paymentInfo.paidAt = new Date();
        this.paymentInfo.transactionId = transactionId;
        this.paymentInfo.paymentGateway = paymentGateway;
    }
    this.transactionId = transactionId; // Backward compatibility
    return this.save();
};

OrderSchema.methods.markAsCompleted = function() {
    this.status = "completed";
    this.coursesGranted = true;
    this.grantedAt = new Date();
    return this.save();
};

OrderSchema.methods.markAsFailed = function(reason = "") {
    this.status = "failed";
    this.notes = reason;
    this.note = reason; // Backward compatibility
    return this.save();
};

OrderSchema.methods.markAsCancelled = function(reason = "") {
    this.status = "cancelled";
    this.notes = reason;
    this.note = reason; // Backward compatibility
    return this.save();
};

OrderSchema.methods.processRefund = function(amount, reason = "", transactionId = "") {
    this.status = "refunded";
    this.refundInfo = {
        amount: amount || this.totalAmount,
        reason,
        refundedAt: new Date(),
        refundTransactionId: transactionId
    };
    return this.save();
};

// Static methods
OrderSchema.statics.findByOrderNumber = function(orderNumber) {
    return this.findOne({ orderNumber });
};

OrderSchema.statics.findByUserId = function(userId, options = {}) {
    const { status, limit = 20, skip = 0, sort = { createdAt: -1 } } = options;
    
    let query = this.find({ 
        $or: [
            { userId: userId },
            { mentee: userId }
        ]
    });
    
    if (status) {
        query = query.where({ status });
    }
    
    return query
        .populate('items.courseId', 'title thumbnail price category')
        .populate('courses', 'title thumbnail price category')
        .populate('booking')
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

OrderSchema.statics.getOrderStats = function(userId) {
    return this.aggregate([
        { 
            $match: { 
                $or: [
                    { userId: new mongoose.Types.ObjectId(userId) },
                    { mentee: new mongoose.Types.ObjectId(userId) }
                ]
            }
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { 
                    $sum: { 
                        $cond: [
                            { $in: ["$status", ["paid", "completed"]] },
                            { $ifNull: ["$totalAmount", "$amount"] },
                            0
                        ]
                    }
                },
                completedOrders: {
                    $sum: { 
                        $cond: [
                            { $eq: ["$status", "completed"] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
};

const Order = mongoose.model("Order", OrderSchema);

export default Order;