import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../identity/user.schema";
import { AuditLog, AuditLogSchema } from "./audit-log.schema";
import { AuditService } from "./audit.service";
import { SiteAdministratorBootstrapService } from "./site-administrator-bootstrap.service";
import { AdminAccountService } from "./admin-account.service";
import { AdminController } from "./admin.controller";
import { IdentityModule } from "../identity/identity.module";

@Global()
@Module({
  imports: [
    IdentityModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AuditService, SiteAdministratorBootstrapService, AdminAccountService],
  exports: [AuditService, SiteAdministratorBootstrapService, MongooseModule],
})
export class AdministrationModule {}
