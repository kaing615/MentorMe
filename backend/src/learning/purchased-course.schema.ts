import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type PurchasedCourseDocument = HydratedDocument<PurchasedCourse>;

@Schema({ timestamps: true, collection: "purchasedcourses" })
export class PurchasedCourse {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentee!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Course", required: true })
  course!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Order", required: true })
  order!: Types.ObjectId;

  @Prop({ default: Date.now })
  purchaseDate!: Date;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: 0, min: 0, max: 100 })
  progress!: number;

  @Prop({ default: Date.now })
  lastAccessDate!: Date;

  @Prop({ default: false })
  isCompleted!: boolean;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;

  @Prop({ default: false })
  certificateIssued!: boolean;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  rating!: number | null;

  @Prop({ default: "" })
  review!: string;

  @Prop({ type: Date, default: null })
  reviewDate!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PurchasedCourseSchema = SchemaFactory.createForClass(PurchasedCourse);
PurchasedCourseSchema.index({ mentee: 1, course: 1 }, { unique: true });
PurchasedCourseSchema.index({ mentee: 1 });
PurchasedCourseSchema.index({ course: 1 });
PurchasedCourseSchema.index({ purchaseDate: -1 });
