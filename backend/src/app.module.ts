import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { CommerceModule } from "./commerce/commerce.module";
import { validateEnvironment } from "./config/env.schema";
import { HealthModule } from "./health/health.module";
import { IdentityModule } from "./identity/identity.module";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { LearningModule } from "./learning/learning.module";
import { MentoringModule } from "./mentoring/mentoring.module";
import { MessagingModule } from "./messaging/messaging.module";
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
    CommerceModule,
    InfrastructureModule,
    IdentityModule,
    LearningModule,
    MentoringModule,
    MessagingModule,
    ProfileModule,
    SupportModule,
  ],
})
export class AppModule {}
