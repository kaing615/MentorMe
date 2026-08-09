import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type RelationshipDocument = HydratedDocument<Relationship>;

@Schema({ collection: "relationships" })
export class Relationship {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentor!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  mentee!: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const RelationshipSchema = SchemaFactory.createForClass(Relationship);
