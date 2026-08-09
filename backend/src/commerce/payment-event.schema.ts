import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type PaymentEventDocument = HydratedDocument<PaymentEvent>;

@Schema({ timestamps: true, collection: "paymentevents" })
export class PaymentEvent {
  @Prop({ required: true, enum: ["vnpay", "momo"] })
  provider!: "vnpay" | "momo";

  @Prop({ required: true })
  eventId!: string;

  @Prop({ required: true })
  transactionId!: string;

  @Prop({ required: true })
  orderNumber!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, enum: ["paid", "failed"] })
  status!: "paid" | "failed";

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Order", required: true })
  order!: Types.ObjectId;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PaymentEventSchema = SchemaFactory.createForClass(PaymentEvent);
PaymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
