import Message from "../models/message.model.js";
import responseHandler from "../handlers/response.handler.js";
import mongoose from "mongoose";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const toId = (id) => new mongoose.Types.ObjectId(String(id));

export const sendMessage = async (req, res) => {
  try {
    const user = req.user || {};
    const senderId = user._id || user.id;
    if (!senderId) {
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );
    }
    if (!isValidId(senderId)) {
      return responseHandler.badRequest(res, "Invalid sender");
    }

    const {
      receiver,
      messageType = "text",
      content = "",
      attachments = [],
    } = req.body || {};
    if (!isValidId(receiver))
      return responseHandler.badRequest(res, "Invalid receiver");
    if (String(senderId) === String(receiver)) {
      return responseHandler.badRequest(res, "Cannot send message to yourself");
    }

    const allowedTypes = new Set(["text", "image", "file"]);
    if (!allowedTypes.has(messageType)) {
      return responseHandler.badRequest(res, "Invalid messageType");
    }

    if (messageType === "text" && !content?.trim()) {
      return responseHandler.badRequest(
        res,
        "Content is required for text messages"
      );
    }
    if (messageType !== "text") {
      if (!Array.isArray(attachments) || attachments.length === 0) {
        return responseHandler.badRequest(
          res,
          "Attachments are required for non-text messages"
        );
      }
      for (const a of attachments) {
        if (!a?.url || !a?.type) {
          return responseHandler.badRequest(
            res,
            "Each attachment must include url and type"
          );
        }
      }
    }

    const doc = await Message.create({
      sender: toId(senderId),
      receiver: toId(receiver),
      messageType,
      content: content?.trim() || "",
      attachments,
      status: "sent",
      sentAt: new Date(),
    });

    return responseHandler.created?.(res, doc) || responseHandler.ok(res, doc);
  } catch (e) {
    console.error("[sendMessage] error:", e);
    return responseHandler.error(res, e);
  }
};

export const listMessages = async (req, res) => {
  try {
    const user = req.user || {};
    const meId = user._id || user.id;
    if (!meId) {
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );
    }
    if (!isValidId(meId))
      return responseHandler.badRequest(res, "Invalid user");
    const me = toId(meId);

    const { peer, limit = 50, cursor } = req.query || {};
    if (!isValidId(peer))
      return responseHandler.badRequest(res, "Invalid peer");
    const peerId = toId(peer);

    const convoFilter = {
      $or: [
        { sender: me, receiver: peerId },
        { sender: peerId, receiver: me },
      ],
    };
    const q = { ...convoFilter };

    if (cursor) {
      const [sentAtStr, idStr] = String(cursor).split("_");
      const sentAt = new Date(sentAtStr);
      const oid = isValidId(idStr) ? new mongoose.Types.ObjectId(idStr) : null;
      if (!isNaN(sentAt.getTime()) && oid) {
        q.$and = [
          convoFilter,
          {
            $or: [
              { sentAt: { $lt: sentAt } },
              { sentAt: sentAt, _id: { $lt: oid } },
            ],
          },
        ];
        delete q.$or;
      }
    }

    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    const items = await Message.find(q)
      .sort({ sentAt: -1, _id: -1 })
      .limit(lim)
      .lean();

    const nextCursor = items.length
      ? `${items[items.length - 1].sentAt.toISOString()}_${
          items[items.length - 1]._id
        }`
      : null;

    return responseHandler.ok(res, { items, nextCursor });
  } catch (e) {
    console.error("[listMessages] error:", e);
    return responseHandler.error(res, e);
  }
};

export const markMessageAsDelivered = async (req, res) => {
  try {
    const user = req.user || {};
    const meId = user._id || user.id;
    if (!meId) {
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );
    }
    const me = toId(meId);

    const { ids = [] } = req.body || {};
    const validIds = ids.filter(isValidId).map(toId);
    if (!validIds.length)
      return responseHandler.badRequest(res, "No valid message IDs provided");

    const r = await Message.updateMany(
      { _id: { $in: validIds }, receiver: me, status: "sent" },
      { $set: { status: "delivered", deliveredAt: new Date() } }
    );

    return responseHandler.ok(res, {
      matched: r.matchedCount,
      modified: r.modifiedCount,
    });
  } catch (e) {
    console.error("[markMessageAsDelivered] error:", e);
    return responseHandler.error(res, e);
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const user = req.user || {};
    const meId = user._id || user.id;
    if (!meId) {
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );
    }
    const me = toId(meId);

    const { peerId } = req.body || {};
    if (!isValidId(peerId))
      return responseHandler.badRequest(res, "Invalid peer ID");

    const r = await Message.updateMany(
      { sender: toId(peerId), receiver: me, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return responseHandler.ok(res, {
      matched: r.matchedCount,
      modified: r.modifiedCount,
    });
  } catch (e) {
    console.error("[markMessagesAsRead] error:", e);
    return responseHandler.error(res, e);
  }
};

export const listConversations = async (req, res) => {
  try {
    const user = req.user || {};
    const meId = user._id || user.id;
    if (!meId) {
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );
    }
    const me = toId(meId);

    const agg = await Message.aggregate([
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
      { $sort: { "lastMessage.sentAt": -1, "lastMessage._id": -1 } },
      {
        $project: {
          peerId: "$_id",
          unreadCount: 1,
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
          _id: 0,
        },
      },
    ]);

    return responseHandler.ok(res, { items: agg });
  } catch (e) {
    console.error("[listConversations] error:", e);
    return responseHandler.error(res, e);
  }
};

export default {
  sendMessage,
  listMessages,
  markMessageAsDelivered,
  markMessagesAsRead,
  listConversations,
};
