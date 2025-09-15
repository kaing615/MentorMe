import mongoose from "mongoose";
import "./purchasedCourse.model.js"; // Import to register model

const orderItemSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  thumbnail: {
    type: String,
    default: "",
  },
});

const billingInfoSchema = new mongoose.Schema({
  email: {
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
  country: {
    type: String,
    default: "Vietnam",
  },
  address: {
    type: String,
    default: "",
  },
});

const paymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["credit_card", "paypal", "vnpay", "momo", "bank_transfer"],
    required: true,
  },
  transactionId: {
    type: String,
    default: "",
  },
  paymentGateway: {
    type: String,
    enum: ["stripe", "paypal", "vnpay", "momo", "manual"],
    default: "manual",
  },
  paidAt: {
    type: Date,
  },
  paymentData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    type: { type: String, enum: ["course", "booking"], default: "course" },

    subtotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountCode: {
      type: String,
      default: "",
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amount: { type: Number, required: true },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    billingInfo: billingInfoSchema,
    paymentInfo: paymentInfoSchema,
    billingInfo: billingInfoSchema,
    paymentInfo: paymentInfoSchema,
    paymentMethod: {
      type: String,
      enum: [
        "bank",
        "momo",
        "paypal",
        "stripe",
        "cash",
        "credit_card",
        "vnpay",
        "bank_transfer",
      ],
      default: "bank",
    },
    transactionId: String,
    note: String,
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    coursesGranted: {
      type: Boolean,
      default: false,
    },
    grantedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Generate order number before save
OrderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

// Virtual for formatted order number
OrderSchema.virtual("formattedOrderNumber").get(function () {
  return this.orderNumber ? `ORD-${this.orderNumber.slice(3)}` : "";
});

// Static method to find by order number
OrderSchema.statics.findByOrderNumber = function (orderNumber) {
  return this.findOne({ orderNumber });
};

// Instance methods
OrderSchema.methods.markAsPaid = async function (
  transactionId,
  paymentGateway = "manual"
) {
  this.status = "paid";
  this.paymentInfo = {
    ...this.paymentInfo,
    transactionId: transactionId,
    paymentGateway: paymentGateway,
    paidAt: new Date(),
  };
  this.transactionId = transactionId;
  await this.save();

  // Grant course access after payment
  await this.grantCourseAccess();

  return this;
};

OrderSchema.methods.markAsFailed = async function (reason) {
  this.status = "failed";
  this.note = reason;
  await this.save();
  return this;
};

OrderSchema.methods.grantCourseAccess = async function () {
  if (this.coursesGranted) {
    console.log(`Course access already granted for order ${this.orderNumber}`);
    return;
  }

  try {
    const Course = mongoose.model("Course");
    const PurchasedCourse = mongoose.model("PurchasedCourse");
    const userId = this.mentee || this.userId;

    // Get course IDs from items or courses array
    let courseIds = [];
    let courseItems = [];

    if (this.items && this.items.length > 0) {
      courseIds = this.items.map((item) => item.courseId);
      courseItems = this.items;
    } else if (this.courses && this.courses.length > 0) {
      courseIds = this.courses;
      // Create items structure if missing
      courseItems = this.courses.map((courseId) => ({ courseId, price: 0 }));
    }

    if (courseIds.length === 0) {
      console.log(`No courses found in order ${this.orderNumber}`);
      return;
    }

    // Add mentee to each course's mentees array AND create purchased course records
    for (let i = 0; i < courseIds.length; i++) {
      const courseId = courseIds[i];
      const courseItem = courseItems[i];

      // Add to course mentees array
      await Course.findByIdAndUpdate(
        courseId,
        {
          $addToSet: { mentees: userId }, // $addToSet prevents duplicates
        },
        { new: true }
      );
      console.log(`Added mentee ${userId} to course ${courseId}`);

      // Create purchased course record
      try {
        const existingPurchase = await PurchasedCourse.findOne({
          mentee: userId,
          course: courseId,
        });

        if (!existingPurchase) {
          await PurchasedCourse.create({
            mentee: userId,
            course: courseId,
            order: this._id,
            price: courseItem.price || 0,
            purchaseDate: new Date(),
          });
          console.log(
            `Created purchased course record for mentee ${userId}, course ${courseId}`
          );
        } else {
          console.log(
            `Purchased course record already exists for mentee ${userId}, course ${courseId}`
          );
        }
      } catch (purchaseError) {
        console.error(`Error creating purchased course record:`, purchaseError);
        // Continue with other courses even if one fails
      }
    }

    // Mark courses as granted
    this.coursesGranted = true;
    this.grantedAt = new Date();
    await this.save();

    console.log(`Course access granted for order ${this.orderNumber}`);
  } catch (error) {
    console.error(
      `Error granting course access for order ${this.orderNumber}:`,
      error
    );
    throw error;
  }
};

export default mongoose.model("Order", OrderSchema);