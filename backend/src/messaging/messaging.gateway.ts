import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { AuthService } from "../identity/auth.service";
import type { UserDocument } from "../identity/user.schema";
import type {
  MarkDeliveredDto,
  MarkReadDto,
  SendMessageDto,
} from "./messaging.dto";
import { MessagingService } from "./messaging.service";

type AuthenticatedSocket = Socket;
type SocketAck = { ok: boolean; data?: unknown; modified?: number; error?: string };

@WebSocketGateway()
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly auth: AuthService,
    private readonly messaging: MessagingService,
  ) {}

  afterInit(server: Server): void {
    server.use((socket, next) => {
      const raw = (socket.handshake.auth as { token?: unknown }).token;
      const token = typeof raw === "string" ? raw.replace(/^Bearer\s+/i, "") : "";
      void this.auth
        .authenticateToken(token)
        .then((user) => {
          (socket.data as { user?: UserDocument }).user = user;
          next();
        })
        .catch(() => next(new Error("Unauthorized")));
    });
  }

  handleConnection(client: AuthenticatedSocket): void {
    void client.join(String(this.user(client)._id));
  }

  @SubscribeMessage("message:send")
  async send(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessageDto,
  ): Promise<SocketAck> {
    try {
      const message = await this.messaging.send(
        String(this.user(client)._id),
        payload,
      );
      this.server.to(String(message.receiver)).emit("message:new", message);
      this.server.to(String(message.sender)).emit("message:new", message);
      return { ok: true, data: message };
    } catch (error) {
      return { ok: false, error: this.message(error) };
    }
  }

  @SubscribeMessage("message:delivered")
  async delivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: MarkDeliveredDto,
  ): Promise<SocketAck> {
    try {
      const result = await this.messaging.markDelivered(
        String(this.user(client)._id),
        payload,
      );
      for (const sender of result.senders) {
        this.server.to(sender).emit("message:delivered", { ids: result.ids });
      }
      return { ok: true, modified: result.modified };
    } catch (error) {
      return { ok: false, error: this.message(error) };
    }
  }

  @SubscribeMessage("message:markRead")
  async read(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: MarkReadDto,
  ): Promise<SocketAck> {
    try {
      const result = await this.messaging.markRead(
        String(this.user(client)._id),
        payload,
      );
      this.server.to(payload.peerId).emit("message:peerRead", {
        readerId: String(this.user(client)._id),
      });
      return { ok: true, modified: result.modified };
    } catch (error) {
      return { ok: false, error: this.message(error) };
    }
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Messaging error";
  }

  private user(client: AuthenticatedSocket): UserDocument {
    const user = (client.data as { user?: UserDocument }).user;
    if (!user) throw new Error("Unauthorized");
    return user;
  }
}
