import mongoose from "mongoose";

const ProcessedEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    aggregateId: { type: String, required: true },
    aggregateVersion: { type: Number, required: true, min: 1 },
    eventType: { type: String, required: true },
    status: {
      type: String,
      enum: ["processing", "completed"],
      required: true,
    },
    leaseUntil: { type: Date },
    processedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ProcessedEventSchema.index({ aggregateId: 1, aggregateVersion: -1 });
ProcessedEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ProcessedEvent ||
  mongoose.model("ProcessedEvent", ProcessedEventSchema);
