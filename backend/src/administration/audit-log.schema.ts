import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type AuditResult = "success" | "failed";
export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: "auditLogs" })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  actor!: Types.ObjectId;

  @Prop({ enum: ["site_administrator", "admin"], required: true })
  actorAdminLevel!: "site_administrator" | "admin";

  @Prop({ required: true, index: true }) action!: string;
  @Prop({ required: true, index: true }) targetType!: string;
  @Prop({ required: true }) targetId!: string;
  @Prop({ default: "" }) reason!: string;
  @Prop({ enum: ["success", "failed"], default: "success" })
  result!: AuditResult;
  @Prop({ type: Object, default: {} }) metadata!: Record<string, unknown>;
  createdAt!: Date;
  updatedAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
