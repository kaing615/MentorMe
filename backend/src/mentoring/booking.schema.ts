import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import type { BookingStatus } from "./booking-state";

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ collection: "bookings" })
export class Booking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Relationship", required: true })
  relationship!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentor!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentee!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ["pending", "active", "rejected", "finished", "cancelled"],
    default: "pending",
  })
  status!: BookingStatus;

  @Prop()
  date!: Date;

  @Prop()
  start!: string;

  @Prop()
  end!: string;

  @Prop()
  notes?: string;

  @Prop()
  declineReason?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  slotId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Availability" })
  availabilityId!: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
