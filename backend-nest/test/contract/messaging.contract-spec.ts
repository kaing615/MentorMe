import { getConnectionToken } from "@nestjs/mongoose";
import jwt from "jsonwebtoken";
import { createConnection, Types } from "mongoose";
import type { Connection } from "mongoose";
import { compareResponses } from "./parity";
import type { ParityRuntime } from "./parity-runtime";
import { startParityRuntime } from "./parity-runtime";

describe("Messaging contract parity", () => {
  let runtime: ParityRuntime;
  let token: string;
  let peerId: Types.ObjectId;
  let deliveredId: Types.ObjectId;

  beforeAll(async () => {
    runtime = await startParityRuntime("messaging", 4204);
    const me = new Types.ObjectId();
    peerId = new Types.ObjectId();
    deliveredId = new Types.ObjectId();
    const readId = new Types.ObjectId();
    const users = [
      {
        _id: me,
        email: "messaging-parity-me@example.com",
        userName: "messaging_parity_me",
        firstName: "Parity",
        lastName: "Me",
        role: "mentee",
        isVerified: true,
      },
      {
        _id: peerId,
        email: "messaging-parity-peer@example.com",
        userName: "messaging_parity_peer",
        firstName: "Parity",
        lastName: "Peer",
        role: "mentor",
        isVerified: true,
      },
    ];
    const messages = [
      {
        _id: deliveredId,
        sender: peerId,
        receiver: me,
        messageType: "text",
        attachments: [],
        status: "sent",
        content: "older unread",
        sentAt: new Date("2026-01-01T10:00:00.000Z"),
        read: false,
      },
      {
        _id: readId,
        sender: me,
        receiver: peerId,
        messageType: "text",
        attachments: [],
        status: "sent",
        content: "latest",
        sentAt: new Date("2026-01-01T11:00:00.000Z"),
        read: false,
      },
    ];

    const legacy = await createConnection(runtime.legacyMongoUrl).asPromise();
    const nest = runtime.nestApp.get<Connection>(getConnectionToken());
    for (const connection of [legacy, nest]) {
      await connection.collection("users").insertMany(users);
      await connection.collection("messages").insertMany(messages);
    }
    await legacy.close();
    token = jwt.sign(
      { id: String(me) },
      process.env.JWT_SECRET ?? "nest-test-secret-with-enough-length",
    );
  }, 20_000);

  afterAll(async () => runtime.stop());

  it("matches unauthenticated message access", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/messages?peer=${String(peerId)}`,
    });
  });

  it("matches ordered message history", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: `/api/v1/messages?peer=${String(peerId)}&limit=1`,
      token,
    });
  });

  it("matches conversation summaries", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "GET",
      path: "/api/v1/messages/conversations",
      token,
    });
  });

  it("matches delivered updates", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "POST",
      path: "/api/v1/messages/mark-delivered",
      token,
      body: { ids: [String(deliveredId)] },
    });
  });

  it("matches read updates", async () => {
    await compareResponses(runtime.legacyBaseUrl, runtime.nestBaseUrl, {
      method: "POST",
      path: "/api/v1/messages/mark-read",
      token,
      body: { peerId: String(peerId) },
    });
  });
});
