import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type DiscountDocument = HydratedDocument<Discount>;

@Schema({ collection: "discounts" })
export class Discount {
  @Prop({ unique: true, required: true, uppercase: true }) code!: string;
  @Prop({ required: true, enum: ["percent", "amount"] })
  type!: "percent" | "amount";
  @Prop({ required: true, min: 0 }) value!: number;
  @Prop({ default: 0, min: 0 }) minOrder!: number;
  @Prop({ default: Date.now }) startDate!: Date;
  @Prop({ required: true }) endDate!: Date;
  @Prop({ default: 1, min: 0 }) quantity!: number;
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: "User", default: [] })
  usedBy!: Types.ObjectId[];
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: "Course", default: [] })
  courses!: Types.ObjectId[];
  @Prop({ default: true }) isActive!: boolean;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);
