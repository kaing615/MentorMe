import mongoose from "mongoose";

const purchasedCourseSchema = new mongoose.Schema(
  {
    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessDate: {
      type: Date,
      default: Date.now,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    review: {
      type: String,
      default: "",
    },
    reviewDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "purchasedcourses", // Explicit collection name to match MongoDB
  }
);

// Index for efficient queries
purchasedCourseSchema.index({ mentee: 1, course: 1 }, { unique: true });
purchasedCourseSchema.index({ mentee: 1 });
purchasedCourseSchema.index({ course: 1 });
purchasedCourseSchema.index({ purchaseDate: -1 });

// Update lastAccessDate when accessed
purchasedCourseSchema.methods.updateLastAccess = function () {
  this.lastAccessDate = new Date();
  return this.save();
};

// Mark as completed
purchasedCourseSchema.methods.markCompleted = function () {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.progress = 100;
  return this.save();
};

// Add or update rating and review
purchasedCourseSchema.methods.addReview = function (rating, review) {
  this.rating = rating;
  this.review = review;
  this.reviewDate = new Date();
  return this.save();
};

const PurchasedCourse = mongoose.model(
  "PurchasedCourse",
  purchasedCourseSchema
);

export default PurchasedCourse;
