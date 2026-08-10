import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import type { Connection, Model } from "mongoose";
import { io, type Socket } from "socket.io-client";
import { User } from "../../src/identity/user.schema";
import { createApplication } from "../../src/main";

type Ack<T = unknown> = { ok: boolean; data?: T; error?: string; modified?: number };

describe("messaging socket", () => {
  let app: INestApplication;
  let connection: Connection;
  let baseUrl: string;
  let me: Types.ObjectId;
  let peer: Types.ObjectId;
  let meToken: string;
  let peerToken: string;
  let sockets: Socket[];

  beforeAll(async () => {
    app = await createApplication();
    connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    const users = app.get<Model<User>>(getModelToken(User.name));
    const [currentUser, peerUser] = await users.create([
      {
        email: "socket-me@example.com",
        userName: "socket_me",
        firstName: "Socket",
        lastName: "Me",
        role: "mentee",
        isVerified: true,
      },
      {
        email: "socket-peer@example.com",
        userName: "socket_peer",
        firstName: "Socket",
        lastName: "Peer",
        role: "mentor",
        isVerified: true,
      },
    ]);
    me = currentUser!._id;
    peer = peerUser!._id;
    await connection.collection("relationships").insertOne({
      mentor: peer,
      mentee: me,
    });
    const jwt = app.get(JwtService);
    meToken = await jwt.signAsync({ id: String(me) });
    peerToken = await jwt.signAsync({ id: String(peer) });
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  beforeEach(async () => {
    sockets = [];
    await connection.collection("messages").deleteMany({});
  });

  afterEach(() => {
    for (const socket of sockets) socket.disconnect();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  const client = (token?: string): Socket => {
    const socket = io(baseUrl, {
      auth: token ? { token } : {},
      autoConnect: false,
      forceNew: true,
      reconnection: false,
      transports: ["websocket"],
    });
    sockets.push(socket);
    return socket;
  };

  const connect = (socket: Socket): Promise<void> =>
    new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
      socket.connect();
    });

  const nextEvent = <T>(socket: Socket, event: string): Promise<T> =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out: ${event}`)), 3_000);
      socket.once(event, (payload: T) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

  const emitWithAck = <T>(socket: Socket, event: string, payload: unknown): Promise<Ack<T>> =>
    new Promise((resolve, reject) => {
      socket.timeout(3_000).emit(event, payload, (error: Error | null, response: Ack<T>) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

  it("allows only configured browser origins", async () => {
    const allowed = await fetch(`${baseUrl}/socket.io/?EIO=4&transport=polling`, {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5173",
    );

    const rejected = await fetch(`${baseUrl}/socket.io/?EIO=4&transport=polling`, {
      headers: { Origin: "https://evil.example.com" },
    });
    expect(rejected.headers.get("access-control-allow-origin")).toBeNull();
  });

  it.each([undefined, "not-a-jwt"])("rejects a missing or invalid JWT", async (token) => {
    const socket = client(token);
    await expect(connect(socket)).rejects.toThrow("Unauthorized");
  });

  it("connects with a verified JWT and routes new messages to both users", async () => {
    const sender = client(meToken);
    const receiver = client(peerToken);
    await Promise.all([connect(sender), connect(receiver)]);
    const senderEvent = nextEvent<{ content: string }>(sender, "message:new");
    const receiverEvent = nextEvent<{ content: string }>(receiver, "message:new");

    const ack = await emitWithAck<{ sender: string; receiver: string; content: string }>(
      sender,
      "message:send",
      { receiver: String(peer), content: "  socket hello  ", messageType: "text" },
    );

    expect(ack).toMatchObject({
      ok: true,
      data: { sender: String(me), receiver: String(peer), content: "socket hello" },
    });
    await expect(senderEvent).resolves.toMatchObject({ content: "socket hello" });
    await expect(receiverEvent).resolves.toMatchObject({ content: "socket hello" });
  });

  it("caps delivery updates at 200 and notifies the sender", async () => {
    const ids = Array.from({ length: 201 }, () => new Types.ObjectId());
    await connection.collection("messages").insertMany(
      ids.map((_id) => ({
        _id,
        sender: peer,
        receiver: me,
        content: "delivery batch",
        messageType: "text",
        status: "sent",
        read: false,
        sentAt: new Date(),
      })),
    );
    const receiver = client(meToken);
    const sender = client(peerToken);
    await Promise.all([connect(receiver), connect(sender)]);
    const delivered = nextEvent<{ ids: string[] }>(sender, "message:delivered");

    const ack = await emitWithAck(receiver, "message:delivered", {
      ids: ids.map(String),
    });

    expect(ack).toEqual({ ok: true, modified: 200 });
    await expect(delivered).resolves.toEqual({ ids: ids.slice(0, 200).map(String) });
    expect(
      await connection.collection("messages").countDocuments({ status: "delivered" }),
    ).toBe(200);
    expect(await connection.collection("messages").countDocuments({ status: "sent" })).toBe(1);
  });

  it("marks a peer's messages read and notifies that peer", async () => {
    await connection.collection("messages").insertOne({
      sender: peer,
      receiver: me,
      content: "read over socket",
      messageType: "text",
      status: "delivered",
      read: false,
      sentAt: new Date(),
    });
    const reader = client(meToken);
    const sender = client(peerToken);
    await Promise.all([connect(reader), connect(sender)]);
    const readEvent = nextEvent<{ readerId: string }>(sender, "message:peerRead");

    const ack = await emitWithAck(reader, "message:markRead", {
      peerId: String(peer),
    });

    expect(ack).toEqual({ ok: true, modified: 1 });
    await expect(readEvent).resolves.toEqual({ readerId: String(me) });
    expect(
      await connection.collection("messages").countDocuments({
        sender: peer,
        receiver: me,
        read: true,
        readAt: { $type: "date" },
      }),
    ).toBe(1);
  });
});
