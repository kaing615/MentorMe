import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    attachments: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],
    status: { type: String, enum: ["sent", "delivered"], default: "sent" },
    content: { type: String, required: true },
    sentAt: { type: Date, default: Date.now, index: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, index: true }
  },
  { timestamps: true }
);

MessageSchema.index({ sender: 1, receiver: 1, sentAt: -1 });
MessageSchema.index({ receiver: 1, read: 1, sentAt: -1 });

export default mongoose.model("Message", MessageSchema);
