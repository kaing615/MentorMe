import { Server } from "socket.io";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

export default function attach(server) {
  const io = new Server(server, { cors: { origin: "*" } });
  const userSockets = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return socket.disconnect(true);
    }

    const key = String(userId);
    socket.join(key);
    if (!userSockets.has(key)) userSockets.set(key, new Set());
    userSockets.get(key).add(socket.id);

    socket.on("message:send", async (payload, cb) => {
      try {
        const {
          receiver,
          messageType = "text",
          content = "",
          attachments = [],
        } = payload || {};
        if (!receiver || !mongoose.Types.ObjectId.isValid(receiver)) {
          return cb?.({ ok: false, error: "Invalid receiver" });
        }
        if (String(receiver) === key) {
          return cb?.({ ok: false, error: "Cannot message yourself" });
        }

        const allowedTypes = new Set(["text", "image", "file"]);
        if (!allowedTypes.has(messageType)) {
          return cb?.({ ok: false, error: "Invalid messageType" });
        }
        if (messageType === "text" && !content.trim()) {
          return cb?.({
            ok: false,
            error: "Content is required for text messages",
          });
        }
        if (
          messageType !== "text" &&
          !(Array.isArray(attachments) && attachments.length)
        ) {
          return cb?.({
            ok: false,
            error: "Attachments are required for non-text messages",
          });
        }

        const doc = await Message.create({
          sender: new mongoose.Types.ObjectId(userId),
          receiver: new mongoose.Types.ObjectId(receiver),
          messageType,
          content: content.trim(),
          attachments,
          status: "sent",
          sentAt: new Date(),
        });

        io.to(String(receiver)).emit("message:new", doc);
        io.to(key).emit("message:new", doc);

        cb?.({ ok: true, data: doc });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on("message:delivered", async ({ ids }, cb) => {
      try {
        const raw = Array.isArray(ids) ? ids : [];
        if (!raw.length) return cb?.({ ok: false, error: "no ids" });

        const limited = raw.slice(0, 200);
        const oidList = limited
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        if (!oidList.length) return cb?.({ ok: false, error: "no valid ids" });

        const r = await Message.updateMany(
          {
            _id: { $in: oidList },
            receiver: new mongoose.Types.ObjectId(userId),
            status: "sent",
          },
          { $set: { status: "delivered", deliveredAt: new Date() } }
        );

        const senders = await Message.distinct("sender", {
          _id: { $in: oidList },
        });
        const idStrings = oidList.map(String);
        for (const s of senders) {
          io.to(String(s)).emit("message:delivered", { ids: idStrings });
        }

        cb?.({ ok: true, modified: r.modifiedCount ?? 0 });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on("message:markRead", async ({ peerId }, cb) => {
      try {
        if (!peerId || !mongoose.Types.ObjectId.isValid(peerId)) {
          return cb?.({ ok: false, error: "Invalid peerId" });
        }
        const r = await Message.updateMany(
          {
            sender: new mongoose.Types.ObjectId(peerId),
            receiver: new mongoose.Types.ObjectId(userId),
            read: false,
          },
          { $set: { read: true, readAt: new Date() } }
        );

        io.to(String(peerId)).emit("message:peerRead", { readerId: userId });

        cb?.({ ok: true, modified: r.modifiedCount ?? r.nModified ?? 0 });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on("disconnect", () => {
      const set = userSockets.get(key);
      if (set) {
        set.delete(socket.id);
        if (!set.size) userSockets.delete(key);
      }
    });
  });

  return io;
}
