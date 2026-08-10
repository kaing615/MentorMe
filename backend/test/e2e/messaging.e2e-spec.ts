import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import type { Connection, Model } from "mongoose";
import request from "supertest";
import { User } from "../../src/identity/user.schema";
import { createApplication } from "../../src/main";

describe("messaging", () => {
  let app: INestApplication;
  let connection: Connection;
  let token: string;
  let me: Types.ObjectId;
  let peer: Types.ObjectId;
  let other: Types.ObjectId;

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    const [currentUser, peerUser, otherUser] = await users.create([
      {
        email: "message-me@example.com",
        userName: "message_me",
        firstName: "Message",
        lastName: "Me",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "message-peer@example.com",
        userName: "message_peer",
        firstName: "Message",
        lastName: "Peer",
        role: "mentor",
        isVerified: true,
        password: "must-not-leak",
      },
      {
        email: "message-other@example.com",
        userName: "message_other",
        firstName: "Message",
        lastName: "Other",
        role: "mentee",
        isVerified: true,
      },
    ]);
    me = currentUser!._id;
    peer = peerUser!._id;
    other = otherUser!._id;
    const relationship = await connection.collection("relationships").insertOne({
      mentor: peer,
      mentee: me,
    });
    await connection.collection("bookings").insertOne({
      relationship: relationship.insertedId,
      mentor: peer,
      mentee: me,
      status: "active",
      date: new Date(),
      start: "09:00",
      end: "09:30",
      slotId: new Types.ObjectId(),
      availabilityId: new Types.ObjectId(),
    });
    await connection.collection("relationships").insertOne({
      mentor: other,
      mentee: me,
    });
    token = await app
      .get(JwtService)
      .signAsync({ id: String(currentUser!._id) });
  });

  beforeEach(async () => {
    await connection.collection("messages").deleteMany({});
    await connection.collection("notifications").deleteMany({});
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("requires a verified JWT", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/messages?peer=${String(peer)}`)
      .expect(401);
  });

  it("creates a message from the authenticated sender", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/messages")
      .set(auth())
      .send({
        sender: String(other),
        receiver: String(peer),
        messageType: "text",
        content: "  hello  ",
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      sender: String(me),
      receiver: String(peer),
      messageType: "text",
      content: "hello",
      status: "sent",
      read: false,
    });
    expect(
      await connection.collection("notifications").countDocuments({
        recipient: peer,
        actor: me,
        type: "message_received",
      }),
    ).toBe(1);
  });

  it("requires an existing mentoring relationship", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/messages")
      .set(auth())
      .send({ receiver: String(other), content: "hello" })
      .expect(403);

    await request(app.getHttpServer())
      .post("/api/v1/messages")
      .set(auth())
      .send({ receiver: String(new Types.ObjectId()), content: "hello" })
      .expect(404);
  });

  it.each([
    ["invalid receiver", { receiver: "bad", content: "hello" }],
    ["self message", { receiver: () => String(me), content: "hello" }],
    ["invalid type", { receiver: () => String(peer), messageType: "video", content: "hello" }],
    ["empty text", { receiver: () => String(peer), content: "   " }],
    ["missing attachment", { receiver: () => String(peer), messageType: "image" }],
    [
      "invalid attachment",
      {
        receiver: () => String(peer),
        messageType: "file",
        attachments: [{ url: "https://example.com/file" }],
      },
    ],
  ])("rejects %s", async (_name, raw) => {
    const body = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [
        key,
        typeof value === "function" ? value() : value,
      ]),
    );
    await request(app.getHttpServer())
      .post("/api/v1/messages")
      .set(auth())
      .send(body)
      .expect(400);
  });

  it("lists newest messages first with a stable cursor", async () => {
    const oldest = new Types.ObjectId();
    const middle = new Types.ObjectId();
    const newest = new Types.ObjectId();
    await connection.collection("messages").insertMany([
      {
        _id: oldest,
        sender: me,
        receiver: peer,
        content: "oldest",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date("2026-01-01T10:00:00.000Z"),
      },
      {
        _id: middle,
        sender: peer,
        receiver: me,
        content: "middle",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date("2026-01-01T11:00:00.000Z"),
      },
      {
        _id: newest,
        sender: other,
        receiver: me,
        content: "different conversation",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date("2026-01-01T12:00:00.000Z"),
      },
    ]);

    const first = await request(app.getHttpServer())
      .get(`/api/v1/messages?peer=${String(peer)}&limit=1`)
      .set(auth())
      .expect(200);
    const firstItems = first.body.data.items as Array<{ content: string }>;
    expect(firstItems.map(({ content }) => content)).toEqual([
      "middle",
    ]);
    expect(first.body.data.nextCursor).toBe(
      `2026-01-01T11:00:00.000Z_${String(middle)}`,
    );

    const second = await request(app.getHttpServer())
      .get(
        `/api/v1/messages?peer=${String(peer)}&limit=1&cursor=${encodeURIComponent(first.body.data.nextCursor as string)}`,
      )
      .set(auth())
      .expect(200);
    const secondItems = second.body.data.items as Array<{ content: string }>;
    expect(secondItems.map(({ content }) => content)).toEqual([
      "oldest",
    ]);
  });

  it("marks delivered messages only when owned by the receiver", async () => {
    const owned = new Types.ObjectId();
    const notOwned = new Types.ObjectId();
    await connection.collection("messages").insertMany([
      {
        _id: owned,
        sender: peer,
        receiver: me,
        content: "owned",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date(),
      },
      {
        _id: notOwned,
        sender: peer,
        receiver: other,
        content: "not owned",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date(),
      },
    ]);

    const response = await request(app.getHttpServer())
      .post("/api/v1/messages/mark-delivered")
      .set(auth())
      .send({ ids: [String(owned), String(notOwned), "bad"] })
      .expect(200);
    expect(response.body.data).toEqual({ matched: 1, modified: 1 });
    expect(
      await connection.collection("messages").countDocuments({
        _id: owned,
        status: "delivered",
        deliveredAt: { $type: "date" },
      }),
    ).toBe(1);
    expect(
      await connection.collection("messages").countDocuments({
        _id: notOwned,
        status: "sent",
      }),
    ).toBe(1);
  });

  it("marks unread messages only from the selected peer", async () => {
    await connection.collection("messages").insertMany([
      {
        sender: peer,
        receiver: me,
        content: "read me",
        messageType: "text",
        status: "delivered",
        read: false,
        sentAt: new Date(),
      },
      {
        sender: other,
        receiver: me,
        content: "leave unread",
        messageType: "text",
        status: "delivered",
        read: false,
        sentAt: new Date(),
      },
    ]);

    const response = await request(app.getHttpServer())
      .post("/api/v1/messages/mark-read")
      .set(auth())
      .send({ peerId: String(peer) })
      .expect(200);
    expect(response.body.data).toEqual({ matched: 1, modified: 1 });
    expect(
      await connection.collection("messages").countDocuments({
        sender: peer,
        receiver: me,
        read: true,
        readAt: { $type: "date" },
      }),
    ).toBe(1);
    expect(
      await connection.collection("messages").countDocuments({
        sender: other,
        receiver: me,
        read: false,
      }),
    ).toBe(1);
  });

  it("returns each conversation's latest message and unread count", async () => {
    await connection.collection("messages").insertMany([
      {
        sender: peer,
        receiver: me,
        content: "unread one",
        messageType: "text",
        status: "delivered",
        read: false,
        sentAt: new Date("2026-01-02T10:00:00.000Z"),
      },
      {
        sender: me,
        receiver: peer,
        content: "latest peer message",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date("2026-01-02T11:00:00.000Z"),
      },
      {
        sender: other,
        receiver: me,
        content: "latest overall",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date("2026-01-02T12:00:00.000Z"),
      },
    ]);

    const response = await request(app.getHttpServer())
      .get("/api/v1/messages/conversations")
      .set(auth())
      .expect(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items[0]).toMatchObject({
      peerId: String(other),
      unreadCount: 1,
      lastMessage: { content: "latest overall" },
    });
    expect(response.body.data.items[1]).toMatchObject({
      peerId: String(peer),
      unreadCount: 1,
      peerInfo: { firstName: "Message", lastName: "Peer" },
      lastMessage: { content: "latest peer message" },
    });
    expect(response.body.data.items[1].peerInfo.password).toBeUndefined();
  });
});
