<<<<<<< HEAD
import mongoose, { Schema, version } from "mongoose";
=======
import mongoose, { version } from "mongoose";
>>>>>>> 320758f58565f1339e2012aa3e2883b8adb53cc1

const NotificationSchema = mongoose.Schema(
    {
        userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, required: true },
        title: String,
        body: String,
        data: { type: Schema.Types.Mixed, default: {}  },
        sourceType: { type: String },
        sourceId: { type: String },
        deliverAt: { type: Date, default: () => new Date() },
        seenAt: Date,
        readAt: Date,
        deduplicationKey: { type: String }
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

<<<<<<< HEAD
export default Notification;
=======
export default Notification;
>>>>>>> 320758f58565f1339e2012aa3e2883b8adb53cc1
