import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  NotImplementedException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { Response } from "express";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { ConfirmManualPaymentDto } from "./dto/confirm-manual-payment.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import type { PaymentCallbackInput } from "./payment-provider";
import { PaymentService } from "./payment.service";
import { VnpayProvider } from "./providers/vnpay.provider";
import { MomoProvider } from "./providers/momo.provider";

@Controller("payment")
export class PaymentController {
  constructor(
    private readonly payments: PaymentService,
    private readonly vnpay: VnpayProvider,
    private readonly momo: MomoProvider,
    private readonly config: ConfigService,
  ) {}

  @Get("vnpay/ipn")
  async vnpayIpn(@Query() input: Record<string, string | string[]>) {
    const query = this.query(input);
    const callback: PaymentCallbackInput = { query, body: {}, headers: {} };
    try {
      const result = await this.payments.handleCallback(this.vnpay, callback);
      return result.duplicate
        ? { RspCode: "02", Message: "Order already confirmed" }
        : result.payment.status === "paid"
          ? { RspCode: "00", Message: "Confirm Success" }
          : { RspCode: "00", Message: "Confirm Failed" };
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message === "Invalid signature"
      ) {
        return { RspCode: "97", Message: "Invalid signature" };
      }
      if (error instanceof NotFoundException) {
        return { RspCode: "01", Message: "Order not found" };
      }
      throw error;
    }
  }

  @Get("vnpay/return")
  async vnpayReturn(@Query() input: Record<string, string | string[]>) {
    const result = await this.payments.handleCallback(this.vnpay, {
      query: this.query(input),
      body: {},
      headers: {},
    });
    return {
      message:
        result.payment.status === "paid"
          ? "Thanh toán thành công!"
          : "Thanh toán thất bại!",
      order: {
        orderNumber: result.payment.orderNumber,
        status: result.payment.status,
        transactionId: result.payment.transactionId,
      },
    };
  }

  @Post("momo/ipn")
  async momoIpn(
    @Body() body: unknown,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const result = await this.payments.handleCallback(this.momo, {
        query: {},
        body,
        headers: request.headers,
      });
      response.status(200).json({
        message: "IPN processed successfully",
        duplicate: result.duplicate,
      });
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message === "Invalid signature"
      ) {
        response.status(400).json({ message: "Invalid signature" });
        return;
      }
      throw error;
    }
  }

  @Post("vnpay/create")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async createVnpay(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreatePaymentDto,
    @Req() request: Request,
  ) {
    const result = await this.payments.create(
      this.vnpay,
      user,
      dto.orderNumber,
      request.ip ?? "127.0.0.1",
      this.config.get<string>("VNPAY_RETURN_URL") ??
        "http://localhost:3000/payment/vnpay/return",
    );
    return { message: "Tạo link thanh toán VNPay thành công!", ...result };
  }

  @Post("momo/create")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async createMomo(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreatePaymentDto,
    @Req() request: Request,
  ) {
    const result = await this.payments.create(
      this.momo,
      user,
      dto.orderNumber,
      request.ip ?? "127.0.0.1",
      this.config.get<string>("MOMO_REDIRECT_URL") ??
        "http://localhost:3000/payment/momo/return",
    );
    return { message: "Tạo link thanh toán MoMo thành công!", ...result };
  }

  @Get("status/:orderNumber")
  @UseGuards(JwtAuthGuard)
  status(
    @CurrentUser() user: UserDocument,
    @Param("orderNumber") orderNumber: string,
  ) {
    return this.payments.status(user, orderNumber);
  }

  @Post("admin/manual-confirm")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  manualAdmin(
    @CurrentUser() user: UserDocument,
    @Body() dto: ConfirmManualPaymentDto,
  ) {
    return this.payments.confirmManual(user, dto);
  }

  @Post("manual")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  manual(
    @CurrentUser() user: UserDocument,
    @Body() dto: ConfirmManualPaymentDto,
  ) {
    return this.payments.confirmManual(user, dto);
  }

  @Post("stripe/create")
  @UseGuards(JwtAuthGuard)
  stripe() {
    throw new NotImplementedException("Stripe payment is not implemented");
  }

  private query(input: Record<string, string | string[]>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        Array.isArray(value) ? (value[0] ?? "") : value,
      ]),
    );
  }
}
