import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { validateEnvironment } from "./config/env.schema";
import { HealthModule } from "./health/health.module";
import { IdentityModule } from "./identity/identity.module";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { ProfileModule } from "./mentoring/profile.module";
import { SupportModule } from "./support/support.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGO_URL"),
      }),
    }),
    HealthModule,
    InfrastructureModule,
    IdentityModule,
    ProfileModule,
    SupportModule,
  ],
})
export class AppModule {}
