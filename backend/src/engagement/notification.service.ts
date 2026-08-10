import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { ClientSession, Model } from "mongoose";
import { Types } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { Notification } from "./notification.schema";

type NotificationInput = {
  recipient: string | Types.ObjectId;
  actor?: string | Types.ObjectId | null;
  type: string;
  title: string;
  body: string;
  link: string;
  metadata?: Record<string, unknown>;
  eventKey: string;
};

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notifications: Model<Notification>,
  ) {}

  async list(user: UserDocument) {
    const [items, unreadCount] = await Promise.all([
      this.notifications
        .find({ recipient: user._id })
        .sort({ createdAt: -1, _id: -1 })
        .populate("actor", "firstName lastName avatarUrl role")
        .lean(),
      this.notifications.countDocuments({ recipient: user._id, readAt: null }),
    ]);
    return { items, unreadCount };
  }

  async markRead(user: UserDocument, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid notification id");
    }
    const notification = await this.notifications.findOneAndUpdate(
      { _id: id, recipient: user._id },
      { $set: { readAt: new Date() } },
      { new: true },
    );
    if (!notification) throw new NotFoundException("Notification not found");
    return notification;
  }

  async markAllRead(user: UserDocument) {
    const result = await this.notifications.updateMany(
      { recipient: user._id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return { modified: result.modifiedCount };
  }

  async notify(input: NotificationInput, session?: ClientSession): Promise<void> {
    await this.notifications.updateOne(
      { eventKey: input.eventKey },
      {
        $setOnInsert: {
          ...input,
          recipient: new Types.ObjectId(String(input.recipient)),
          actor: input.actor ? new Types.ObjectId(String(input.actor)) : null,
          readAt: null,
        },
      },
      session ? { upsert: true, session } : { upsert: true },
    );
  }
}
