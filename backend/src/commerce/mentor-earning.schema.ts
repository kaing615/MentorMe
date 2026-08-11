import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type MentorEarningStatus =
  | "pending"
  | "eligible"
  | "paid"
  | "cancelled";
export type MentorEarningDocument = HydratedDocument<MentorEarning>;

@Schema({ timestamps: true, collection: "mentorEarnings" })
export class MentorEarning {
  @Prop({ required: true, unique: true }) sourceKey!: string;
  @Prop({ enum: ["course", "booking"], required: true })
  sourceType!: "course" | "booking";
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentor!: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentee!: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Order", required: true })
  order!: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Booking" })
  booking?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Course" })
  course?: Types.ObjectId;
  @Prop({ required: true, min: 0 }) grossAmount!: number;
  @Prop({ required: true, min: 0 }) platformFeeAmount!: number;
  @Prop({ required: true, min: 0 }) netAmount!: number;
  @Prop({ enum: ["VND"], default: "VND" }) currency!: "VND";
  @Prop({
    enum: ["pending", "eligible", "paid", "cancelled"],
    default: "pending",
  })
  status!: MentorEarningStatus;
  @Prop() eligibleAt?: Date;
  @Prop() paidAt?: Date;
  @Prop({ default: "" }) payoutReference!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const MentorEarningSchema = SchemaFactory.createForClass(MentorEarning);
