import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type ReviewDocument = HydratedDocument<Review>;
export type ReviewTargetType = "Course" | "Mentor" | "Booking";

@Schema({ timestamps: true, collection: "reviews" })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  author!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ["Course", "Mentor", "Booking"],
    required: true,
  })
  targetType!: ReviewTargetType;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  target!: Types.ObjectId;

  @Prop()
  content?: string;

  @Prop({ required: true })
  rate!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index(
  { author: 1, targetType: 1, target: 1 },
  { unique: true },
);
ReviewSchema.index({ targetType: 1, target: 1, createdAt: -1 });
