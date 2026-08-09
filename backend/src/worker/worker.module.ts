import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { validateEnvironment } from "../config/env.schema";
import { User, UserSchema } from "../identity/user.schema";
import { Availability, AvailabilitySchema } from "../mentoring/availability.schema";
import { AvailabilityService } from "../mentoring/availability.service";
import { AvailabilityCleanupService } from "./availability-cleanup.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGO_URL"),
      }),
    }),
    MongooseModule.forFeature([
      { name: Availability.name, schema: AvailabilitySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [AvailabilityCleanupService, AvailabilityService],
})
export class WorkerModule {}
