import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email/email.service";
import { CloudinaryService } from "./files/cloudinary.service";

@Global()
@Module({
  providers: [EmailService, CloudinaryService],
  exports: [EmailService, CloudinaryService],
})
export class InfrastructureModule {}
