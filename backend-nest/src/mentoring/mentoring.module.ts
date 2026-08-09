import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { Availability, AvailabilitySchema } from "./availability.schema";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityService } from "./availability.service";
import { BookingController } from "./booking.controller";
import { Booking, BookingSchema } from "./booking.schema";
import { BookingService } from "./booking.service";
import { Relationship, RelationshipSchema } from "./relationship.schema";
import { ReviewController } from "./review.controller";
import { Review, ReviewSchema } from "./review.schema";
import { ReviewService } from "./review.service";

@Module({
  imports: [
    IdentityModule,
    MongooseModule.forFeature([
      { name: Availability.name, schema: AvailabilitySchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Relationship.name, schema: RelationshipSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [AvailabilityController, BookingController, ReviewController],
  providers: [AvailabilityService, BookingService, ReviewService],
  exports: [AvailabilityService, BookingService, ReviewService, MongooseModule],
})
export class MentoringModule {}
