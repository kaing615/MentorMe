import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { User, UserSchema } from "./user.schema";
import { UserController } from "./user.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [UserController],
  providers: [JwtAuthGuard, AuthService],
  exports: [JwtAuthGuard, JwtModule, MongooseModule, AuthService],
})
export class IdentityModule {}
