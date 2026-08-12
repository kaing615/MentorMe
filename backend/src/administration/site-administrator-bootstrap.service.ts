import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import bcrypt from "bcryptjs";
import type { Model } from "mongoose";
import { User, type UserDocument } from "../identity/user.schema";

@Injectable()
export class SiteAdministratorBootstrapService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensure();
  }

  async ensure(): Promise<UserDocument> {
    const existing = await this.users.findOne({ adminLevel: "site_administrator" });
    if (existing) return existing;

    const email = this.config.get<string>("SITE_ADMIN_EMAIL")?.trim().toLowerCase();
    const password = this.config.get<string>("SITE_ADMIN_PASSWORD");
    const firstName = this.config.get<string>("SITE_ADMIN_FIRST_NAME")?.trim();
    const lastName = this.config.get<string>("SITE_ADMIN_LAST_NAME")?.trim();
    if (!email || !password || !firstName || !lastName) {
      throw new Error("Site administrator bootstrap is not configured");
    }

    const account = await this.users.findOne({ email });
    if (account) {
      if (account.role !== "admin" && ["mentor", "mentee"].includes(account.role ?? "")) {
        account.roleBeforeAdmin = account.role as "mentor" | "mentee";
      }
      account.role = "admin";
      account.roles = [...new Set([...(account.roles ?? []), "admin"])] as User["roles"];
      account.adminLevel = "site_administrator";
      account.isVerified = true;
      return account.save();
    }

    return this.users.create({
      email,
      userName: email.split("@")[0],
      firstName,
      lastName,
      password: await bcrypt.hash(password, 10),
      role: "admin",
      roles: ["admin"],
      adminLevel: "site_administrator",
      isVerified: true,
    });
  }
}
