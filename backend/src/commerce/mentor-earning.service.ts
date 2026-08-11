import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { Types } from "mongoose";
import { hasUserRole } from "../common/auth/user-role";
import type { UserDocument } from "../identity/user.schema";
import type { MarkEarningPaidDto } from "./dto/mark-earning-paid.dto";
import { MentorEarning } from "./mentor-earning.schema";

@Injectable()
export class MentorEarningService {
  constructor(
    @InjectModel(MentorEarning.name)
    private readonly earnings: Model<MentorEarning>,
  ) {}

  async mine(user: UserDocument) {
    if (!hasUserRole(user, "mentor")) {
      throw new ForbiddenException("Mentor only");
    }
    const items = await this.earnings
      .find({ mentor: user._id })
      .sort({ createdAt: -1 })
      .populate("mentee", "firstName lastName avatarUrl")
      .populate("course", "title thumbnail")
      .lean();
    return { items, total: items.length, summary: this.summary(items) };
  }

  async all(user: UserDocument, status?: string) {
    this.requireAdmin(user);
    const filter = status ? { status } : {};
    const items = await this.earnings
      .find(filter)
      .sort({ createdAt: -1 })
      .populate("mentor", "firstName lastName email avatarUrl")
      .populate("mentee", "firstName lastName email")
      .lean();
    return { items, total: items.length, summary: this.summary(items) };
  }

  async markPaid(user: UserDocument, id: string, dto: MarkEarningPaidDto) {
    this.requireAdmin(user);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid earning ID");
    }
    const earning = await this.earnings.findById(id);
    if (!earning) throw new NotFoundException("Earning not found");
    if (earning.status !== "eligible") {
      throw new BadRequestException("Only eligible earnings can be paid");
    }
    earning.status = "paid";
    earning.paidAt = new Date();
    earning.payoutReference = dto.payoutReference.trim();
    await earning.save();
    return { message: "Mentor payout recorded", earning };
  }

  private summary(items: Array<{ status: string; netAmount: number }>) {
    return {
      pending: items
        .filter(({ status }) => status === "pending")
        .reduce((sum, { netAmount }) => sum + netAmount, 0),
      eligible: items
        .filter(({ status }) => status === "eligible")
        .reduce((sum, { netAmount }) => sum + netAmount, 0),
      paid: items
        .filter(({ status }) => status === "paid")
        .reduce((sum, { netAmount }) => sum + netAmount, 0),
    };
  }

  private requireAdmin(user: UserDocument): void {
    if (user.role !== "admin") throw new ForbiddenException("Admin only");
  }
}
