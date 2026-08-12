import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { UserDocument } from "../identity/user.schema";
import { CreateHelpRequestDto } from "./dto/create-help-request.dto";
import { UpdateHelpRequestDto } from "./dto/update-help-request.dto";
import { RespondHelpRequestDto } from "./dto/respond-help-request.dto";
import { HelpRequestService } from "./help-request.service";

@Controller("help/help-requests")
export class HelpRequestController {
  constructor(private readonly helpRequests: HelpRequestService) {}

  @Post()
  create(
    @Body() dto: CreateHelpRequestDto,
    @Headers("user-agent") userAgent: string | undefined,
    @Ip() ipAddress: string,
  ) {
    return this.helpRequests.createGuest(dto, {
      userAgent: userAgent ?? "Unknown",
      ipAddress,
    });
  }

  @Get("ticket/:ticketNumber")
  getByTicket(
    @Param("ticketNumber") ticketNumber: string,
    @Query("email") email?: string,
  ) {
    return this.helpRequests.getByTicket(ticketNumber, email);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  getMine(
    @CurrentUser() user: UserDocument,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.helpRequests.getMine(user, page, limit);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @CurrentUser() user: UserDocument,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.helpRequests.list(user, query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  getById(@CurrentUser() user: UserDocument, @Param("id") id: string) {
    return this.helpRequests.getById(user, id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body() dto: UpdateHelpRequestDto,
  ) {
    return this.helpRequests.update(user, id, dto);
  }

  @Post(":id/respond")
  @UseGuards(JwtAuthGuard)
  respond(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body() dto: RespondHelpRequestDto,
  ) {
    return this.helpRequests.respond(user, id, dto);
  }

  @Post(":id/retry-email")
  @UseGuards(JwtAuthGuard)
  retryEmail(@CurrentUser() user: UserDocument, @Param("id") id: string) {
    return this.helpRequests.retryEmail(user, id);
  }
}
