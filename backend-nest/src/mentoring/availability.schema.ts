import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type AvailabilityDocument = HydratedDocument<Availability>;

@Schema({ _id: true })
export class AvailabilitySlot {
  _id!: Types.ObjectId;

  @Prop({ required: true })
  start!: string;

  @Prop({ required: true })
  end!: string;

  @Prop({
    type: String,
    enum: ["open", "held", "booked", "blocked", "pending"],
    default: "open",
  })
  status!: "open" | "held" | "booked" | "blocked" | "pending";

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  bookedBy?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Booking" })
  bookingId?: Types.ObjectId;

  @Prop()
  holdUntil?: Date;
}

const AvailabilitySlotSchema = SchemaFactory.createForClass(AvailabilitySlot);

@Schema({ timestamps: true, collection: "availabilities" })
export class Availability {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  mentor!: Types.ObjectId;

  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ default: "Asia/Ho_Chi_Minh" })
  timezone!: string;

  @Prop({ type: [AvailabilitySlotSchema], default: [] })
  slots!: AvailabilitySlot[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);
AvailabilitySchema.index({ mentor: 1, date: 1 }, { unique: true });
