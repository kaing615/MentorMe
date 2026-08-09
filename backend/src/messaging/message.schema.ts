import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type MessageDocument = HydratedDocument<Message>;
export type MessageType = "text" | "image" | "file";

@Schema({ _id: true })
export class MessageAttachment {
  _id!: Types.ObjectId;

  @Prop({ required: true })
  url!: string;

  @Prop()
  name?: string;

  @Prop({ required: true })
  type!: string;
}

const MessageAttachmentSchema = SchemaFactory.createForClass(MessageAttachment);

@Schema({ timestamps: true, collection: "messages" })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  sender!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  receiver!: Types.ObjectId;

  @Prop({ type: String, enum: ["text", "image", "file"], default: "text" })
  messageType!: MessageType;

  @Prop({ type: [MessageAttachmentSchema], default: [] })
  attachments!: MessageAttachment[];

  @Prop({ type: String, enum: ["sent", "delivered"], default: "sent" })
  status!: "sent" | "delivered";

  @Prop({ default: "" })
  content!: string;

  @Prop({ default: Date.now })
  sentAt!: Date;

  @Prop({ default: false })
  read!: boolean;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ sender: 1, receiver: 1, sentAt: -1, _id: -1 });
MessageSchema.index({ receiver: 1, sender: 1, sentAt: -1, _id: -1 });
