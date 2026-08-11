import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type MentorApplicationStatus = "pending" | "approved" | "rejected";
export type MentorApplicationDocument = HydratedDocument<MentorApplication>;

@Schema({ timestamps: true, collection: "mentorApplications" })
export class MentorApplication {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true, unique: true })
  user!: Types.ObjectId;

  @Prop({ enum: ["pending", "approved", "rejected"], default: "pending" })
  status!: MentorApplicationStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop({ default: "" })
  reviewReason!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MentorApplicationSchema =
  SchemaFactory.createForClass(MentorApplication);
