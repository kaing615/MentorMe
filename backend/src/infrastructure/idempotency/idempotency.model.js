import mongoose from "mongoose";

const IdempotencySchema = new mongoose.Schema(
  {
    scope: { type: String, required: true },
    key: { type: String, required: true },
    requestHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
      required: true,
    },
    result: { type: mongoose.Schema.Types.Mixed },
    errorCode: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      required: true,
    },
  },
  { timestamps: true }
);

IdempotencySchema.index({ scope: 1, key: 1 }, { unique: true });
IdempotencySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.IdempotencyRecord ||
  mongoose.model("IdempotencyRecord", IdempotencySchema);
