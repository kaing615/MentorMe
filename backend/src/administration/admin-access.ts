import { ForbiddenException } from "@nestjs/common";
import type { UserDocument } from "../identity/user.schema";

export const assertAdmin = (user: UserDocument): void => {
  if (user.role !== "admin") throw new ForbiddenException("Admin only");
};

export const assertSiteAdministrator = (user: UserDocument): void => {
  assertAdmin(user);
  if (user.adminLevel !== "site_administrator") {
    throw new ForbiddenException("Site administrator only");
  }
};
