import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { ClientSession, Connection, Model } from "mongoose";
import { Types } from "mongoose";
import { Course } from "./course.schema";
import { PurchasedCourse, type PurchasedCourseDocument } from "./purchased-course.schema";

export type GrantCourseAccessInput = {
  menteeId: string;
  courseId: string;
  orderId: string;
  price: number;
  session?: ClientSession;
};

@Injectable()
export class EnrolmentService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(PurchasedCourse.name)
    private readonly purchases: Model<PurchasedCourse>,
  ) {}

  grantCourseAccess(input: GrantCourseAccessInput): Promise<PurchasedCourseDocument> {
    if (input.session) return this.grant(input, input.session);
    return this.connection.transaction((session) => this.grant(input, session));
  }

  private async grant(
    input: GrantCourseAccessInput,
    session: ClientSession,
  ): Promise<PurchasedCourseDocument> {
    const course = await this.courses.updateOne(
      { _id: input.courseId },
      { $addToSet: { mentees: input.menteeId } },
      { session },
    );
    if (course.matchedCount !== 1) throw new NotFoundException("Course not found.");

    const purchase = await this.purchases.findOneAndUpdate(
      { mentee: input.menteeId, course: input.courseId },
      {
        $setOnInsert: {
          mentee: new Types.ObjectId(input.menteeId),
          course: new Types.ObjectId(input.courseId),
          order: new Types.ObjectId(input.orderId),
          price: input.price,
          purchaseDate: new Date(),
          lastAccessDate: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, session },
    );
    if (!purchase) throw new InternalServerErrorException("Could not grant course access");
    return purchase;
  }
}
