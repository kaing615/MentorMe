import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: true })
export class CartCourse {
  _id!: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Course", required: true })
  course!: Types.ObjectId;
  @Prop({ default: Date.now }) addedAt!: Date;
}

const CartCourseSchema = SchemaFactory.createForClass(CartCourse);

@Schema({ timestamps: true, collection: "carts" })
export class Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  user!: Types.ObjectId;
  @Prop({ type: [CartCourseSchema], default: [] })
  courses!: CartCourse[];
  @Prop({ default: 0, min: 0 }) totalPrice!: number;
  @Prop({ default: "" }) discountCode!: string;
  @Prop({ default: 0, min: 0 }) discountAmount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ "courses.course": 1 });
