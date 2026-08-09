import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { helpStatuses } from "./dto/update-help-request.dto";
import {
  issueCategories,
  priorityLevels,
} from "./dto/create-help-request.dto";

export type HelpRequestDocument = HydratedDocument<HelpRequest>;

@Schema({
  timestamps: true,
  collection: "helprequests",
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class HelpRequest {
  @Prop({ type: Types.ObjectId, ref: "User" })
  user?: Types.ObjectId;

  @Prop({ trim: true, lowercase: true })
  guestEmail?: string;

  @Prop({ trim: true, maxlength: 100 })
  guestName?: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  subject!: string;

  @Prop({ type: String, required: true, enum: issueCategories, default: "General Inquiry" })
  issueCategory!: (typeof issueCategories)[number];

  @Prop({ type: String, required: true, enum: priorityLevels, default: "Medium" })
  priorityLevel!: (typeof priorityLevels)[number];

  @Prop({ required: true, trim: true, maxlength: 2000 })
  issueDetails!: string;

  @Prop({ type: String, enum: helpStatuses, default: "Open", index: true })
  status!: (typeof helpStatuses)[number];

  @Prop()
  adminResponse?: string;

  @Prop({ type: Types.ObjectId, ref: "User" })
  respondedBy?: Types.ObjectId;

  @Prop()
  respondedAt?: Date;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop({ unique: true, index: true })
  ticketNumber?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const HelpRequestSchema = SchemaFactory.createForClass(HelpRequest);

HelpRequestSchema.pre("save", function assignTicket(next) {
  if (!this.ticketNumber && this.isNew) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketNumber = `TICKET-${timestamp}-${random}`;
  }
  next();
});

HelpRequestSchema.index({ user: 1, createdAt: -1 });
HelpRequestSchema.index({ guestEmail: 1, createdAt: -1 });
HelpRequestSchema.index({ status: 1, priorityLevel: 1 });
HelpRequestSchema.index({ issueCategory: 1, status: 1 });
HelpRequestSchema.index({ createdAt: -1 });
