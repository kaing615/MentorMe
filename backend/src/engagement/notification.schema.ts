import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true, collection: "notifications" })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  recipient!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  actor!: Types.ObjectId | null;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ required: true })
  link!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ required: true, unique: true })
  eventKey!: string;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, readAt: 1 });
