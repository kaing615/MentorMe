import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { InfrastructureModule } from "../infrastructure/infrastructure.module";
import { MentoringModule } from "../mentoring/mentoring.module";
import { CourseController } from "./course.controller";
import { Course, CourseSchema } from "./course.schema";
import { CourseService } from "./course.service";
import { EnrolmentService } from "./enrolment.service";
import { Lesson, LessonSchema } from "./lesson.schema";
import { PurchasedCourseController } from "./purchased-course.controller";
import { PurchasedCourse, PurchasedCourseSchema } from "./purchased-course.schema";
import { PurchasedCourseService } from "./purchased-course.service";

@Module({
  imports: [
    IdentityModule,
    InfrastructureModule,
    MentoringModule,
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: PurchasedCourse.name, schema: PurchasedCourseSchema },
    ]),
  ],
  controllers: [CourseController, PurchasedCourseController],
  providers: [CourseService, EnrolmentService, PurchasedCourseService],
  exports: [CourseService, EnrolmentService, MongooseModule],
})
export class LearningModule {}
