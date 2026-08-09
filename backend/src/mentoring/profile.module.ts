import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { ProfileController } from "./profile.controller";
import { Profile, ProfileSchema } from "./profile.schema";
import { ProfileService } from "./profile.service";

@Module({
  imports: [
    IdentityModule,
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService, MongooseModule],
})
export class ProfileModule {}
