import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import type { Request } from "express";
import type { Model } from "mongoose";
import { User, UserDocument } from "../../identity/user.schema";

type LegacyJwtPayload = {
  id?: string;
  sub?: string;
  data?: string;
};

export type AuthenticatedRequest = Request & { user: UserDocument };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization ?? "";
    if (!authorization.startsWith("Bearer ")) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<LegacyJwtPayload>(
        authorization.slice(7),
      );
      const userId = payload.id ?? payload.sub ?? payload.data;
      if (!userId) throw new UnauthorizedException();

      const user = await this.users.findById(userId).select("-password -__v");
      if (!user || !user.isVerified) throw new UnauthorizedException();
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
