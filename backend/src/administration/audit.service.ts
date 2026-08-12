import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { ClientSession, FilterQuery, Model } from "mongoose";
import type { UserDocument } from "../identity/user.schema";
import { assertAdmin } from "./admin-access";
import { AuditLog } from "./audit-log.schema";

export type AuditEventInput = {
  actor: UserDocument;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  result?: "success" | "failed";
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private readonly logs: Model<AuditLog>) {}

  async record(input: AuditEventInput, session?: ClientSession): Promise<void> {
    const [created] = await this.logs.create(
      [{
        actor: input.actor._id,
        actorAdminLevel: input.actor.adminLevel ?? "admin",
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason ?? "",
        result: input.result ?? "success",
        metadata: input.metadata ?? {},
      }],
      session ? { session } : {},
    );
    void created;
  }

  async list(
    actor: UserDocument,
    query: Record<string, string | undefined>,
  ) {
    assertAdmin(actor);
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const filter: FilterQuery<AuditLog> = {};
    if (query.action) filter.action = query.action;
    if (query.targetType) filter.targetType = query.targetType;
    if (actor.adminLevel !== "site_administrator") {
      filter.action = { $not: /^admin_access\./ };
    }
    const [items, total] = await Promise.all([
      this.logs.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("actor", "firstName lastName email").lean(),
      this.logs.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
}
