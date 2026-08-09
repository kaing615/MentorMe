import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { HelpRequestController } from "./help-request.controller";
import { HelpRequest, HelpRequestSchema } from "./help-request.schema";
import { HelpRequestService } from "./help-request.service";

@Module({
  imports: [
    IdentityModule,
    MongooseModule.forFeature([
      { name: HelpRequest.name, schema: HelpRequestSchema },
    ]),
  ],
  controllers: [HelpRequestController],
  providers: [HelpRequestService],
})
export class SupportModule {}
