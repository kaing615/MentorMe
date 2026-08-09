import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({ timestamps: true, collection: "lessons" })
export class Lesson {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  videoUrl?: string;

  @Prop()
  documentUrl?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Course", required: true })
  course!: Types.ObjectId;

  @Prop()
  order?: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
