import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  userName!: string;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop()
  password?: string;

  @Prop()
  googleId?: string;

  @Prop({ default: "" })
  avatarUrl!: string;

  @Prop({ default: "" })
  avatarPublicId!: string;

  @Prop()
  jobTitle?: string;

  @Prop()
  location?: string;

  @Prop()
  category?: string;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop()
  bio?: string;

  @Prop()
  linkedinUrl?: string;

  @Prop()
  introVideo?: string;

  @Prop()
  mentorReason?: string;

  @Prop()
  greatestAchievement?: string;

  @Prop({ type: String, enum: ["mentor", "mentee", "admin"] })
  role?: "mentor" | "mentee" | "admin";

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop()
  verifyKey?: string;

  @Prop()
  verifyKeyExpires?: Date;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
