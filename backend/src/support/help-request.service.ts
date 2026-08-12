import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { isValidObjectId, Model, Types } from "mongoose";
import sanitizeHtml from "sanitize-html";
import { AuditService } from "../administration/audit.service";
import type { UserDocument } from "../identity/user.schema";
import { EmailService } from "../infrastructure/email/email.service";
import type { RespondHelpRequestDto } from "./dto/respond-help-request.dto";
import type { CreateHelpRequestDto } from "./dto/create-help-request.dto";
import type { UpdateHelpRequestDto } from "./dto/update-help-request.dto";
import { HelpRequest } from "./help-request.schema";

type RequestMetadata = { userAgent: string; ipAddress: string };

@Injectable()
export class HelpRequestService {
  constructor(
    @InjectModel(HelpRequest.name)
    private readonly requests: Model<HelpRequest>,
    private readonly email: EmailService,
    private readonly audit: AuditService,
  ) {}

  async createGuest(dto: CreateHelpRequestDto, metadata: RequestMetadata) {
    const created = await this.requests.create({
      ...dto,
      guestName: sanitizeHtml(dto.guestName, { allowedTags: [] }).trim(),
      guestEmail: dto.guestEmail.toLowerCase().trim(),
      subject: sanitizeHtml(dto.subject, { allowedTags: [] }).trim(),
      issueDetails: sanitizeHtml(dto.issueDetails, { allowedTags: [] }).trim(),
      ...metadata,
    });

    return {
      success: true,
      data: {
        ticketNumber: created.ticketNumber,
        status: created.status,
        message: `Help request submitted successfully! Ticket #${created.ticketNumber}`,
      },
    };
  }

  async getByTicket(ticketNumber: string, email?: string) {
    if (!email) {
      throw new BadRequestException("Ticket number and email are required.");
    }
    const normalizedEmail = email.toLowerCase().trim();
    const ticket = await this.requests
      .findOne({
        ticketNumber: ticketNumber.toUpperCase(),
        guestEmail: normalizedEmail,
      })
      .select("-userAgent -ipAddress")
      .lean();
    if (!ticket) throw new NotFoundException("Help request not found.");
    return this.format(ticket);
  }

  async getMine(user: UserDocument, pageValue?: string, limitValue?: string) {
    const page = Math.max(Number(pageValue) || 1, 1);
    const limit = Math.min(Math.max(Number(limitValue) || 10, 1), 50);
    const query = { user: user._id };
    const [items, total] = await Promise.all([
      this.requests
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.requests.countDocuments(query),
    ]);
    return { items: items.map((item) => this.format(item)), total, page, limit };
  }

  async list(user: UserDocument, query: Record<string, string | undefined>) {
    this.requireAdmin(user);
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const filter: Record<string, string> = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priorityLevel = query.priority;
    if (query.category) filter.issueCategory = query.category;
    const [items, total] = await Promise.all([
      this.requests
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.requests.countDocuments(filter),
    ]);
    return { items: items.map((item) => this.format(item)), total, page, limit };
  }

  async getById(user: UserDocument, id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException("Invalid ticket ID format.");
    }
    const ticket = await this.requests.findById(id).lean();
    if (!ticket) throw new NotFoundException("Help request not found.");
    if (user.role !== "admin" && String(ticket.user) !== String(user._id)) {
      throw new ForbiddenException(
        "You do not have permission to view this ticket.",
      );
    }
    return this.format(ticket);
  }

  async update(user: UserDocument, id: string, dto: UpdateHelpRequestDto) {
    this.requireAdmin(user);
    if (!isValidObjectId(id)) {
      throw new BadRequestException("Invalid ticket ID format.");
    }
    const ticket = await this.requests.findById(id);
    if (!ticket) throw new NotFoundException("Help request not found.");
    if (dto.status) ticket.status = dto.status;
    if (dto.adminResponse !== undefined) {
      ticket.adminResponse = sanitizeHtml(dto.adminResponse.trim(), {
        allowedTags: ["p", "br", "strong", "em"],
        allowedAttributes: {},
      });
      ticket.respondedBy = new Types.ObjectId(user._id);
      ticket.respondedAt = new Date();
    }
    await ticket.save();
    return {
      success: true,
      data: this.format(ticket.toObject()),
      message: "Help request updated successfully.",
    };
  }

  async respond(user: UserDocument, id: string, dto: RespondHelpRequestDto) {
    this.requireAdmin(user);
    if (!isValidObjectId(id)) throw new BadRequestException("Invalid ticket ID format.");
    const ticket = await this.requests.findById(id).populate("user", "email firstName lastName");
    if (!ticket) throw new NotFoundException("Help request not found.");
    const owner = ticket.user as unknown as { email?: string; firstName?: string; lastName?: string } | undefined;
    const recipient = ticket.guestEmail ?? owner?.email;
    if (!recipient) throw new BadRequestException("Help request has no email recipient.");
    ticket.adminResponse = sanitizeHtml(dto.adminResponse.trim(), {
      allowedTags: ["p", "br", "strong", "em"],
      allowedAttributes: {},
    });
    ticket.status = dto.status;
    ticket.respondedBy = new Types.ObjectId(user._id);
    ticket.respondedAt = new Date();
    ticket.emailRecipient = recipient;
    ticket.emailDeliveryStatus = "pending";
    ticket.emailDeliveryError = "";
    await ticket.save();
    try {
      await this.email.sendHelpResponse({
        to: recipient,
        name: ticket.guestName ?? (`${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim() || "bạn"),
        ticketNumber: ticket.ticketNumber ?? id,
        subject: ticket.subject,
        response: ticket.adminResponse,
      });
      ticket.emailDeliveryStatus = "sent";
      ticket.emailSentAt = new Date();
    } catch (error) {
      ticket.emailDeliveryStatus = "failed";
      ticket.emailDeliveryError = error instanceof Error ? error.message.slice(0, 300) : "Email delivery failed";
    }
    await ticket.save();
    await this.audit.record({
      actor: user,
      action: "help_request.responded",
      targetType: "help_request",
      targetId: id,
      result: ticket.emailDeliveryStatus === "sent" ? "success" : "failed",
    });
    return this.format(ticket.toObject());
  }

  async retryEmail(user: UserDocument, id: string) {
    this.requireAdmin(user);
    if (!isValidObjectId(id)) throw new BadRequestException("Invalid ticket ID format.");
    const ticket = await this.requests.findById(id).populate("user", "email firstName lastName");
    if (!ticket) throw new NotFoundException("Help request not found.");
    if (!ticket.adminResponse) throw new BadRequestException("Help request has no saved response.");
    const owner = ticket.user as unknown as { email?: string; firstName?: string; lastName?: string } | undefined;
    const recipient = ticket.emailRecipient ?? ticket.guestEmail ?? owner?.email;
    if (!recipient) throw new BadRequestException("Help request has no email recipient.");
    try {
      await this.email.sendHelpResponse({
        to: recipient,
        name: ticket.guestName ?? (`${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim() || "bạn"),
        ticketNumber: ticket.ticketNumber ?? id,
        subject: ticket.subject,
        response: ticket.adminResponse,
      });
      ticket.emailDeliveryStatus = "sent";
      ticket.emailSentAt = new Date();
      ticket.emailDeliveryError = "";
    } catch (error) {
      ticket.emailDeliveryStatus = "failed";
      ticket.emailDeliveryError = error instanceof Error ? error.message.slice(0, 300) : "Email delivery failed";
    }
    await ticket.save();
    await this.audit.record({
      actor: user,
      action: "help_request.email_retried",
      targetType: "help_request",
      targetId: id,
      result: ticket.emailDeliveryStatus === "sent" ? "success" : "failed",
    });
    return this.format(ticket.toObject());
  }

  private requireAdmin(user: UserDocument): void {
    if (user.role !== "admin") throw new ForbiddenException("Access denied.");
  }

  private format<T extends object>(ticket: T) {
    const timestamps = ticket as T & {
      createdAt?: unknown;
      respondedAt?: unknown;
    };
    const createdAt =
      timestamps.createdAt instanceof Date ? timestamps.createdAt : null;
    const respondedAt =
      timestamps.respondedAt instanceof Date ? timestamps.respondedAt : null;
    const hours =
      createdAt && respondedAt
        ? Math.floor((respondedAt.getTime() - createdAt.getTime()) / 3_600_000)
        : null;
    return { ...ticket, responseTime: hours };
  }
}
