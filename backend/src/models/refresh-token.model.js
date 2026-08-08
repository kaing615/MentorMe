import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    familyId: { type: String, required: true, index: true },
    parentHash: { type: String },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", RefreshTokenSchema);
