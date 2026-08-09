import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrderService } from "./order.service";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: UserDocument,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.orders.list(
      user,
      status,
      Math.max(Number(page) || 1, 1),
      Math.min(Math.max(Number(limit) || 10, 1), 100),
    );
  }

  @Get("statistics")
  statistics(@CurrentUser() user: UserDocument) {
    return this.orders.statistics(user);
  }

  @Get("admin/all")
  all(
    @CurrentUser() user: UserDocument,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.orders.all(
      user,
      status,
      Math.max(Number(page) || 1, 1),
      Math.min(Math.max(Number(limit) || 20, 1), 100),
    );
  }

  @Put("admin/:orderNumber/status")
  updateStatus(
    @CurrentUser() user: UserDocument,
    @Param("orderNumber") orderNumber: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user, orderNumber, dto);
  }

  @Put(":orderNumber/cancel")
  cancel(
    @CurrentUser() user: UserDocument,
    @Param("orderNumber") orderNumber: string,
    @Body("reason") reason?: string,
  ) {
    return this.orders.cancel(user, orderNumber, reason);
  }

  @Get(":orderNumber")
  detail(
    @CurrentUser() user: UserDocument,
    @Param("orderNumber") orderNumber: string,
  ) {
    return this.orders.detail(user, orderNumber);
  }
}
