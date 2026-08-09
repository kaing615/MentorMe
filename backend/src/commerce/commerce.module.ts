import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
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

@Module({
  imports: [
    IdentityModule,
    LearningModule,
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Discount.name, schema: DiscountSchema },
      { name: Order.name, schema: OrderSchema },
      { name: PaymentEvent.name, schema: PaymentEventSchema },
    ]),
  ],
  controllers: [CartController, OrderController, PaymentController],
  providers: [
    CartService,
    MomoProvider,
    OrderService,
    PaymentService,
    VnpayProvider,
  ],
  exports: [PaymentService, MongooseModule],
})
export class CommerceModule {}
