import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly carts: CartService) {}

  @Get()
  get(@CurrentUser() user: UserDocument) {
    return this.carts.get(user);
  }

  @Post()
  @HttpCode(200)
  add(@CurrentUser() user: UserDocument, @Body() dto: AddCartItemDto) {
    return this.carts.add(user, dto.courseId);
  }

  @Post("add")
  @HttpCode(200)
  addAlias(@CurrentUser() user: UserDocument, @Body() dto: AddCartItemDto) {
    return this.carts.add(user, dto.courseId);
  }

  @Get("check/:courseId")
  check(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
  ) {
    return this.carts.check(user, courseId);
  }

  @Put("update/:courseId")
  update() {
    return this.carts.unsupportedQuantity();
  }

  @Put()
  applyDiscount(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.carts.applyDiscount(user, dto.discountCode);
  }

  @Delete("clear")
  clearAlias(@CurrentUser() user: UserDocument) {
    return this.carts.clear(user);
  }

  @Delete("remove/:courseId")
  removeAlias(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
  ) {
    return this.carts.remove(user, courseId);
  }

  @Delete(":courseId")
  remove(
    @CurrentUser() user: UserDocument,
    @Param("courseId") courseId: string,
  ) {
    return this.carts.remove(user, courseId);
  }

  @Delete()
  clear(@CurrentUser() user: UserDocument) {
    return this.carts.clear(user);
  }
}
