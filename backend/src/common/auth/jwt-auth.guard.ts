import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../../identity/auth.service";
import type { UserDocument } from "../../identity/user.schema";

export type AuthenticatedRequest = Request & { user: UserDocument };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization ?? "";
    if (!authorization.startsWith("Bearer ")) {
      throw new UnauthorizedException();
    }

    request.user = await this.auth.authenticateToken(authorization.slice(7));
    return true;
  }
}
