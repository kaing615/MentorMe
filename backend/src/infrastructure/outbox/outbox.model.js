import mongoose from "mongoose";

const OutboxEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    aggregateId: { type: String, required: true },
    aggregateVersion: { type: Number, required: true, min: 1 },
    payloadVersion: { type: Number, required: true, min: 1, default: 1 },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    occurredAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "leased", "published"],
      default: "pending",
      required: true,
    },
    leaseOwner: { type: String },
    leaseUntil: { type: Date },
    publishedAt: { type: Date },
    attempts: { type: Number, default: 0, min: 0 },
    lastError: { type: String },
  },
  { timestamps: true }
);

OutboxEventSchema.index({ status: 1, leaseUntil: 1, occurredAt: 1 });
OutboxEventSchema.index({ aggregateId: 1, aggregateVersion: 1 });
OutboxEventSchema.index({ publishedAt: 1 });

export default mongoose.models.OutboxEvent ||
  mongoose.model("OutboxEvent", OutboxEventSchema);
