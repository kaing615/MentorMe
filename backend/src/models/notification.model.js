import mongoose from "mongoose";

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: String,
    body: String,
    data: { type: Schema.Types.Mixed, default: {} },
    sourceType: String,
    sourceId: String,
    deliverAt: { type: Date, default: () => new Date(), index: true },
    seenAt: Date,
    readAt: Date,
    deduplicationKey: String,
  },
  {
    versionKey: false,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index(
  { userId: 1, deduplicationKey: 1 },
  {
    unique: true,
    partialFilterExpression: { deduplicationKey: { $exists: true } },
  }
);

NotificationSchema.index({ userId: 1, deliverAt: -1, _id: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Notification", NotificationSchema);
