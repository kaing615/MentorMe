import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, FilterQuery, Model } from "mongoose";
import { Types } from "mongoose";
import type {
  MarkDeliveredDto,
  MarkReadDto,
  MessageListQueryDto,
  SendMessageDto,
} from "./messaging.dto";
import { Message } from "./message.schema";
import type { MessageDocument, MessageType } from "./message.schema";
import { User } from "../identity/user.schema";
import { NotificationService } from "../engagement/notification.service";

type DeliveryResult = {
  matched: number;
  modified: number;
  ids: string[];
  senders: string[];
};

@Injectable()
export class MessagingService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Message.name) private readonly messages: Model<Message>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly notifications: NotificationService,
  ) {}

  async send(senderId: string, input: SendMessageDto): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(input.receiver)) {
      throw new BadRequestException("Invalid receiver");
    }
    if (senderId === input.receiver) {
      throw new BadRequestException("Cannot send message to yourself");
    }
    await this.assertCanMessage(senderId, input.receiver);
    const messageType: MessageType = input.messageType ?? "text";
    if (!["text", "image", "file"].includes(messageType)) {
      throw new BadRequestException("Invalid messageType");
    }
    const content = input.content?.trim() ?? "";
    if (messageType === "text" && !content) {
      throw new BadRequestException("Content is required for text messages");
    }
    const attachments = input.attachments ?? [];
    if (messageType !== "text" && attachments.length === 0) {
      throw new BadRequestException(
        "Attachments are required for non-text messages",
      );
    }
    if (
      attachments.some(
        ({ url, type }) =>
          typeof url !== "string" ||
          !url.trim() ||
          typeof type !== "string" ||
          !type.trim(),
      )
    ) {
      throw new BadRequestException("Each attachment must include url and type");
    }

    return this.connection.transaction(async (session) => {
      const message = new this.messages({
        sender: new Types.ObjectId(senderId),
        receiver: new Types.ObjectId(input.receiver),
        messageType,
        content,
        attachments,
        status: "sent",
        sentAt: new Date(),
        read: false,
      });
      await message.save({ session });
      await this.notifications.notify(
        {
          recipient: input.receiver,
          actor: senderId,
          type: "message_received",
          title: "New message",
          body: content || "You received a new attachment.",
          link: `/messages/${senderId}`,
          metadata: { messageId: String(message._id) },
          eventKey: `message:received:${String(message._id)}`,
        },
        session,
      );
      return message;
    });
  }

  private async assertCanMessage(senderId: string, receiverId: string): Promise<void> {
    const sender = new Types.ObjectId(senderId);
    const receiver = new Types.ObjectId(receiverId);
    const [senderUser, receiverUser] = await Promise.all([
      this.users.findById(sender).select("role").lean(),
      this.users.findById(receiver).select("role").lean(),
    ]);
    if (!receiverUser) throw new NotFoundException("Receiver not found");
    if (!senderUser) throw new NotFoundException("Sender not found");
    if (senderUser.role === "admin" || receiverUser.role === "admin") return;

    const pair = [
      { mentor: sender, mentee: receiver },
      { mentor: receiver, mentee: sender },
    ];
    const [relationship, course] = await Promise.all([
      this.connection.collection("relationships").findOne({ $or: pair }),
      this.connection.collection("courses").findOne({
        $or: [
          { mentor: sender, mentees: receiver },
          { mentor: receiver, mentees: sender },
        ],
      }),
    ]);
    if (!relationship && !course) {
      throw new ForbiddenException(
        "Messaging is available after a booking or course purchase",
      );
    }
  }

  async list(userId: string, query: MessageListQueryDto) {
    if (!Types.ObjectId.isValid(query.peer)) {
      throw new BadRequestException("Invalid peer");
    }
    const me = new Types.ObjectId(userId);
    const peer = new Types.ObjectId(query.peer);
    const conversation: FilterQuery<Message> = {
      $or: [
        { sender: me, receiver: peer },
        { sender: peer, receiver: me },
      ],
    };
    const filter = this.withCursor(conversation, query.cursor);
    const items = await this.messages
      .find(filter)
      .sort({ sentAt: -1, _id: -1 })
      .limit(Math.min(query.limit ?? 50, 200))
      .lean();
    const last = items.at(-1);
    return {
      items,
      nextCursor: last ? `${last.sentAt.toISOString()}_${String(last._id)}` : null,
    };
  }

  async markDelivered(userId: string, dto: MarkDeliveredDto): Promise<DeliveryResult> {
    const candidates = dto.ids
      .slice(0, 200)
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (candidates.length === 0) {
      throw new BadRequestException("No valid message IDs provided");
    }
    const receiver = new Types.ObjectId(userId);
    const owned = await this.messages
      .find({ _id: { $in: candidates }, receiver })
      .select("_id sender")
      .lean();
    const ids = owned.map(({ _id }) => String(_id));
    const senders = [...new Set(owned.map(({ sender }) => String(sender)))];
    const result = await this.messages.updateMany(
      { _id: { $in: ids }, receiver, status: "sent" },
      { $set: { status: "delivered", deliveredAt: new Date() } },
    );
    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      ids,
      senders,
    };
  }

  async markRead(userId: string, dto: MarkReadDto) {
    if (!Types.ObjectId.isValid(dto.peerId)) {
      throw new BadRequestException("Invalid peer ID");
    }
    const result = await this.messages.updateMany(
      {
        sender: new Types.ObjectId(dto.peerId),
        receiver: new Types.ObjectId(userId),
        read: false,
      },
      { $set: { read: true, readAt: new Date() } },
    );
    return { matched: result.matchedCount, modified: result.modifiedCount };
  }

  async conversations(userId: string) {
    const me = new Types.ObjectId(userId);
    const items = await this.messages.aggregate([
      { $match: { $or: [{ sender: me }, { receiver: me }] } },
      { $sort: { sentAt: -1, _id: -1 } },
      {
        $addFields: {
          peer: { $cond: [{ $eq: ["$sender", me] }, "$receiver", "$sender"] },
          isUnreadForMe: {
            $and: [{ $eq: ["$receiver", me] }, { $eq: ["$read", false] }],
          },
        },
      },
      {
        $group: {
          _id: "$peer",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: { $sum: { $cond: ["$isUnreadForMe", 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "peerInfo",
        },
      },
      { $unwind: { path: "$peerInfo", preserveNullAndEmptyArrays: true } },
      { $sort: { "lastMessage.sentAt": -1, "lastMessage._id": -1 } },
      {
        $project: {
          _id: 0,
          peerId: "$_id",
          unreadCount: 1,
          peerInfo: {
            firstName: 1,
            lastName: 1,
            userName: 1,
            avatarUrl: 1,
            role: 1,
          },
          lastMessage: {
            _id: 1,
            sender: 1,
            receiver: 1,
            content: 1,
            messageType: 1,
            attachments: 1,
            sentAt: 1,
            read: 1,
            status: 1,
          },
        },
      },
    ]);
    return { items };
  }

  private withCursor(
    conversation: FilterQuery<Message>,
    cursor?: string,
  ): FilterQuery<Message> {
    if (!cursor) return conversation;
    const [sentAtValue, id] = cursor.split("_");
    const sentAt = new Date(sentAtValue ?? "");
    if (Number.isNaN(sentAt.getTime()) || !id || !Types.ObjectId.isValid(id)) {
      return conversation;
    }
    return {
      $and: [
        conversation,
        {
          $or: [
            { sentAt: { $lt: sentAt } },
            { sentAt, _id: { $lt: new Types.ObjectId(id) } },
          ],
        },
      ],
    };
  }
}
