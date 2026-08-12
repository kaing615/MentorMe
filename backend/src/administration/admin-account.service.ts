import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectConnection } from "@nestjs/mongoose";
import bcrypt from "bcryptjs";
import type { Connection, FilterQuery, Model } from "mongoose";
import { Types } from "mongoose";
import { User, type UserDocument } from "../identity/user.schema";
import { assertAdmin, assertSiteAdministrator } from "./admin-access";
import { AuditService } from "./audit.service";
import type { AdminUserQueryDto } from "./dto/admin-user-query.dto";
import type { ChangeAdminEmailDto } from "./dto/change-admin-email.dto";
import type { ChangeAdminPasswordDto } from "./dto/change-admin-password.dto";
import type { UpdateAdminProfileDto } from "./dto/update-admin-profile.dto";

@Injectable()
export class AdminAccountService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectConnection() private readonly connection: Connection,
    private readonly audit: AuditService,
  ) {}

  me(user: UserDocument) {
    assertAdmin(user);
    return this.safe(user);
  }

  async listUsers(user: UserDocument, query: AdminUserQueryDto) {
    assertAdmin(user);
    const filter: FilterQuery<User> = {};
    if (query.role) filter.role = query.role;
    if (query.verified !== undefined) filter.isVerified = query.verified;
    if (query.suspended !== undefined) filter.isSuspended = query.suspended;
    if (query.search?.trim()) {
      const search = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["firstName", "lastName", "email", "userName"].map((field) => ({ [field]: { $regex: search, $options: "i" } }));
    }
    const [items, total] = await Promise.all([
      this.users.find(filter).select("-password -verifyKey -resetToken -verifyKeyExpires -resetTokenExpires").sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
      this.users.countDocuments(filter),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async overview(user: UserDocument) {
    assertAdmin(user);
    const db = this.connection;
    const [totalUsers, pendingApplications, activeSessions, openHelpRequests, suspendedCourses, refundPending, eligiblePayouts, recentActivity] = await Promise.all([
      this.users.countDocuments(),
      db.collection("mentorApplications").countDocuments({ status: "pending" }),
      db.collection("bookings").countDocuments({ status: { $in: ["pending", "active"] } }),
      db.collection("helprequests").countDocuments({ status: { $in: ["Open", "In Progress"] } }),
      db.collection("courses").countDocuments({ moderationStatus: "suspended" }),
      db.collection("bookings").countDocuments({ paymentStatus: "refund_pending" }),
      db.collection("mentorEarnings").countDocuments({ status: "eligible" }),
      this.audit.list(user, { page: "1", limit: "8" }),
    ]);
    return {
      metrics: { totalUsers, pendingApplications, activeSessions, openHelpRequests },
      needsAttention: { pendingApplications, suspendedCourses, refundPending, eligiblePayouts, openHelpRequests },
      recentActivity: recentActivity.items,
    };
  }

  async suspend(actor: UserDocument, id: string, reason: string) {
    const target = await this.target(actor, id);
    if (target.adminLevel === "site_administrator") throw new ForbiddenException("Site administrator is protected");
    target.isSuspended = true;
    target.suspensionReason = reason.trim();
    target.suspendedAt = new Date();
    target.suspendedBy = actor._id;
    await target.save();
    await this.audit.record({ actor, action: "user.suspended", targetType: "user", targetId: id, reason });
    return this.safe(target);
  }

  async restore(actor: UserDocument, id: string) {
    const target = await this.target(actor, id);
    target.isSuspended = false;
    target.suspensionReason = "";
    target.set("suspendedAt", undefined);
    target.set("suspendedBy", undefined);
    await target.save();
    await this.audit.record({ actor, action: "user.restored", targetType: "user", targetId: id });
    return this.safe(target);
  }

  async grantAdmin(actor: UserDocument, id: string) {
    assertSiteAdministrator(actor);
    const target = await this.target(actor, id);
    if (target.adminLevel) throw new BadRequestException("Account is already an administrator");
    if (["mentor", "mentee"].includes(target.role ?? "")) target.roleBeforeAdmin = target.role as "mentor" | "mentee";
    target.role = "admin";
    target.roles = [...new Set([...(target.roles ?? []), "admin"])] as User["roles"];
    target.adminLevel = "admin";
    await target.save();
    await this.audit.record({ actor, action: "admin_access.granted", targetType: "user", targetId: id });
    return this.safe(target);
  }

  async revokeAdmin(actor: UserDocument, id: string) {
    assertSiteAdministrator(actor);
    const target = await this.target(actor, id);
    if (String(actor._id) === id) throw new ForbiddenException("Cannot revoke your own access");
    if (target.adminLevel === "site_administrator") throw new ForbiddenException("Site administrator is protected");
    if (target.adminLevel !== "admin") throw new BadRequestException("Account is not an Admin");
    const restored = target.roleBeforeAdmin ?? "mentee";
    target.role = restored;
    target.roles = [...new Set((target.roles ?? []).filter((role) => role !== "admin").concat(restored))] as User["roles"];
    target.set("adminLevel", undefined);
    target.set("roleBeforeAdmin", undefined);
    await target.save();
    await this.audit.record({ actor, action: "admin_access.revoked", targetType: "user", targetId: id });
    return this.safe(target);
  }

  async updateProfile(user: UserDocument, dto: UpdateAdminProfileDto) {
    assertAdmin(user);
    user.firstName = dto.firstName.trim();
    user.lastName = dto.lastName.trim();
    await user.save();
    await this.audit.record({ actor: user, action: "admin_settings.profile_updated", targetType: "user", targetId: String(user._id) });
    return this.safe(user);
  }

  async changeEmail(user: UserDocument, dto: ChangeAdminEmailDto) {
    const account = await this.checkPassword(user, dto.currentPassword);
    if (await this.users.exists({ email: dto.email, _id: { $ne: user._id } })) throw new BadRequestException("Email is already in use");
    account.email = dto.email;
    await account.save();
    await this.audit.record({ actor: user, action: "admin_settings.email_updated", targetType: "user", targetId: String(user._id) });
    return this.safe(account);
  }

  async changePassword(user: UserDocument, dto: ChangeAdminPasswordDto) {
    const account = await this.checkPassword(user, dto.currentPassword);
    account.password = await bcrypt.hash(dto.newPassword, 10);
    await account.save();
    await this.audit.record({ actor: user, action: "admin_settings.password_updated", targetType: "user", targetId: String(user._id) });
    return { success: true };
  }

  private async checkPassword(user: UserDocument, password: string) {
    assertAdmin(user);
    const account = await this.users.findById(user._id).select("+password");
    if (!account?.password || !(await bcrypt.compare(password, account.password))) throw new BadRequestException("Current password is incorrect");
    return account;
  }

  private async target(actor: UserDocument, id: string) {
    assertAdmin(actor);
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid user ID");
    const target = await this.users.findById(id);
    if (!target) throw new NotFoundException("User not found");
    return target;
  }

  private safe(user: UserDocument) {
    const value = user.toObject() as unknown as Record<string, unknown>;
    for (const key of ["password", "verifyKey", "verifyKeyExpires", "resetToken", "resetTokenExpires"]) delete value[key];
    return value;
  }
}
