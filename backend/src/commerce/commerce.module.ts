import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { EngagementModule } from "../engagement/engagement.module";
import { LearningModule } from "../learning/learning.module";
import { CartController } from "./cart.controller";
import { Cart, CartSchema } from "./cart.schema";
import { CartService } from "./cart.service";
import { Discount, DiscountSchema } from "./discount.schema";
import { OrderController } from "./order.controller";
import { Order, OrderSchema } from "./order.schema";
import { OrderService } from "./order.service";
import { PaymentController } from "./payment.controller";
import { PaymentEvent, PaymentEventSchema } from "./payment-event.schema";
import { PaymentService } from "./payment.service";
import { VnpayProvider } from "./providers/vnpay.provider";
import { MomoProvider } from "./providers/momo.provider";
import { MentorEarningController } from "./mentor-earning.controller";
import { MentorEarningService } from "./mentor-earning.service";
import { Booking, BookingSchema } from "../mentoring/booking.schema";
import {
  MentorEarning,
  MentorEarningSchema,
} from "./mentor-earning.schema";

@Module({
  imports: [
    IdentityModule,
    EngagementModule,
    LearningModule,
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Discount.name, schema: DiscountSchema },
      { name: Order.name, schema: OrderSchema },
      { name: PaymentEvent.name, schema: PaymentEventSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: MentorEarning.name, schema: MentorEarningSchema },
    ]),
  ],
  controllers: [
    CartController,
    OrderController,
    PaymentController,
    MentorEarningController,
  ],
  providers: [
    CartService,
    MomoProvider,
    OrderService,
    PaymentService,
    VnpayProvider,
    MentorEarningService,
  ],
  exports: [PaymentService, MongooseModule],
})
export class CommerceModule {}
