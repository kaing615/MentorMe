import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import type { OrderStatus } from "./order-state";

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Course", required: true })
  courseId!: Types.ObjectId;
  @Prop({ required: true }) title!: string;
  @Prop({ required: true, min: 0 }) price!: number;
  @Prop({ default: 1, min: 1 }) quantity!: number;
  @Prop({ default: "" }) thumbnail!: string;
}

@Schema({ _id: false })
export class BillingInfo {
  @Prop({ required: true }) email!: string;
  @Prop({ required: true }) firstName!: string;
  @Prop({ required: true }) lastName!: string;
  @Prop({ default: "Vietnam" }) country!: string;
  @Prop({ default: "" }) address!: string;
}

@Schema({ _id: false })
export class PaymentInfo {
  @Prop() method?: string;
  @Prop({ default: "" }) transactionId!: string;
  @Prop({ default: "manual" }) paymentGateway!: string;
  @Prop() paidAt?: Date;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  paymentData!: Record<string, unknown>;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
const BillingInfoSchema = SchemaFactory.createForClass(BillingInfo);
const PaymentInfoSchema = SchemaFactory.createForClass(PaymentInfo);

@Schema({ timestamps: true, collection: "orders" })
export class Order {
  @Prop({ unique: true, required: true })
  orderNumber!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentee!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  userId!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItem[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: "Course", default: [] })
  courses!: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Booking" })
  booking?: Types.ObjectId;

  @Prop({ enum: ["course", "booking"], default: "course" })
  type!: "course" | "booking";

  @Prop({ required: true, min: 0 }) subtotalAmount!: number;
  @Prop({ default: "" }) discountCode!: string;
  @Prop({ default: 0, min: 0 }) discountAmount!: number;
  @Prop({ required: true }) amount!: number;
  @Prop({ required: true, min: 0 }) totalAmount!: number;
  @Prop({ type: BillingInfoSchema }) billingInfo?: BillingInfo;
  @Prop({ type: PaymentInfoSchema }) paymentInfo?: PaymentInfo;
  @Prop({ default: "bank" }) paymentMethod!: string;
  @Prop() transactionId?: string;
  @Prop() note?: string;
  @Prop() notes?: string;

  @Prop({
    enum: [
      "pending",
      "processing",
      "paid",
      "completed",
      "failed",
      "cancelled",
      "refunded",
    ],
    default: "pending",
  })
  status!: OrderStatus;

  @Prop({ default: false }) coursesGranted!: boolean;
  @Prop() grantedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
