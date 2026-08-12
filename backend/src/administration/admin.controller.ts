import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { AdminAccountService } from "./admin-account.service";
import { AuditService } from "./audit.service";
import { AdminUserQueryDto } from "./dto/admin-user-query.dto";
import { ChangeAdminEmailDto } from "./dto/change-admin-email.dto";
import { ChangeAdminPasswordDto } from "./dto/change-admin-password.dto";
import { SuspendUserDto } from "./dto/suspend-user.dto";
import { UpdateAdminProfileDto } from "./dto/update-admin-profile.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly accounts: AdminAccountService, private readonly auditLogs: AuditService) {}

  @Get("me") me(@CurrentUser() user: UserDocument) { return this.accounts.me(user); }
  @Get("overview") overview(@CurrentUser() user: UserDocument) { return this.accounts.overview(user); }
  @Get("audit") audit(@CurrentUser() user: UserDocument, @Query() query: Record<string, string | undefined>) { return this.auditLogs.list(user, query); }
  @Get("users") users(@CurrentUser() user: UserDocument, @Query() query: AdminUserQueryDto) { return this.accounts.listUsers(user, query); }
  @Patch("users/:id/suspend") suspend(@CurrentUser() user: UserDocument, @Param("id") id: string, @Body() dto: SuspendUserDto) { return this.accounts.suspend(user, id, dto.reason); }
  @Patch("users/:id/restore") restore(@CurrentUser() user: UserDocument, @Param("id") id: string) { return this.accounts.restore(user, id); }
  @Patch("users/:id/grant-admin") grant(@CurrentUser() user: UserDocument, @Param("id") id: string) { return this.accounts.grantAdmin(user, id); }
  @Patch("users/:id/revoke-admin") revoke(@CurrentUser() user: UserDocument, @Param("id") id: string) { return this.accounts.revokeAdmin(user, id); }
  @Patch("settings/profile") profile(@CurrentUser() user: UserDocument, @Body() dto: UpdateAdminProfileDto) { return this.accounts.updateProfile(user, dto); }
  @Patch("settings/email") email(@CurrentUser() user: UserDocument, @Body() dto: ChangeAdminEmailDto) { return this.accounts.changeEmail(user, dto); }
  @Patch("settings/password") password(@CurrentUser() user: UserDocument, @Body() dto: ChangeAdminPasswordDto) { return this.accounts.changePassword(user, dto); }
}
