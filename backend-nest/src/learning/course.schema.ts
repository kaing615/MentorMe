import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true, collection: "courses" })
export class Course {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop()
  shortDescription?: string;

  @Prop()
  keyLearningObjectives?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: "" })
  thumbnail!: string;

  @Prop({ default: "" })
  thumbnailPublicId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentor!: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: "User", default: [] })
  mentors!: Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: "User", default: [] })
  mentees!: Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: "Lesson", default: [] })
  lessons!: Types.ObjectId[];

  @Prop({ required: true })
  category!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  language!: string[];

  @Prop({ enum: ["Beginner", "Intermediate", "Advanced", "Expert"] })
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert";

  @Prop({ default: 0 })
  duration!: number;

  @Prop({ default: 0 })
  rate!: number;

  @Prop({ default: 0 })
  numberOfRatings!: number;

  @Prop({ required: true })
  link!: string;

  @Prop({ required: true })
  lectures!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
