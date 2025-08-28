import mongoose, { version } from "mongoose";

const NotificationSchema = mongoose.Schema(
    {
        userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, required: true },
        title: String,
        body: String,
        data: { type: mongoose.Types.Mixed, default: {}  },
        sourceType: { type: String },
        sourceId: { type: String },
        deliverAt: { type: Date, default: () => new Date() },
        seenAt: Date,
        readAt: Date,
        deduplicationKey: { type: String, unique: true }
    },
    {
        versionKey: false,
        timestamps: { createdAt: true, updatedAt: false },
    }
)

NotificationSchema.index(
    { userId: 1, deduplicationKey: 1 },
    { unique: true, partialFilterExpression: { deduplicationKey: { $exists: true } } }
);

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;