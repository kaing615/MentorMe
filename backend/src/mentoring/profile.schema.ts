import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ _id: false })
export class ProfileLinks {
  @Prop({ default: "" }) website!: string;
  @Prop({ default: "" }) twitter!: string;
  @Prop({ default: "" }) linkedin!: string;
  @Prop({ default: "" }) github!: string;
  @Prop({ default: "" }) youtube!: string;
  @Prop({ default: "" }) facebook!: string;
}

const ProfileLinksSchema = SchemaFactory.createForClass(ProfileLinks);

@Schema({ timestamps: true, collection: "profiles" })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user!: Types.ObjectId;
  @Prop({ default: "" }) jobTitle!: string;
  @Prop({ default: "" }) location!: string;
  @Prop({ default: "" }) category!: string;
  @Prop({ default: "" }) bio!: string;
  @Prop({ type: [String], default: [] }) skills!: string[];
  @Prop({ default: "" }) experience!: string;
  @Prop({ default: "" }) headline!: string;
  @Prop({ default: "" }) mentorReason!: string;
  @Prop({ default: "" }) greatestAchievement!: string;
  @Prop({ default: "" }) introVideo!: string;
  @Prop({ default: "" }) description!: string;
  @Prop({ default: "" }) goal!: string;
  @Prop({ default: "" }) education!: string;
  @Prop({ type: [String], default: [] }) languages!: string[];
  @Prop({ default: "" }) timezone!: string;
  @Prop({ type: ProfileLinksSchema, default: () => ({}) })
  links!: ProfileLinks;
  @Prop({ type: [Types.ObjectId], ref: "Review", default: [] })
  reviews!: Types.ObjectId[];
  @Prop({ default: 0 }) rate!: number;
  @Prop({ default: 0, min: 0 }) sessionPrice!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
ProfileSchema.index({ user: 1 }, { unique: true });
