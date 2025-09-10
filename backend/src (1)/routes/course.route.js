import express from "express";
import * as CourseCtl from "../controllers/course.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import upload from "../utils/multer.js";
import {
  createCourseSchema,
  updateCourseSchema,
  addMentorSchema,
  addContentSchema,
  addReviewSchema,
} from "../validations/course.validation.js";

const router = express.Router();

// Gộp cả named exports và default export (nếu có)
const C = { ...CourseCtl, ...(CourseCtl.default || {}) };

// Báo lỗi sớm nếu thiếu handler nào (đỡ “argument handler must be a function”)
[
  "getRelatedCourses",
  "getCoursesByMentor",
  "getCourses",
  "getCourseById",
  "getMyCourses",
  "createCourse",
  "updateCourse",
  "deleteCourse",
  "addCourseReview",
  "getCourseReviews",
  "addMentorToCourse",
  "removeMentorFromCourse",
  "addContentToCourse",
  "removeContentFromCourse",
  "checkCoursePurchaseStatus",
].forEach((name) => {
  if (typeof C[name] !== "function") {
    throw new Error(
      `controllers/course.controller.js is missing exported function: ${name}`
    );
  }
});

// Joi -> middleware
const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const payload = { ...req.body, ...req.params, ...req.query };
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation error", details: error.details });
  }
  req.body = { ...req.body, ...value };
  next();
};

/** ========= PUBLIC ========= */
router.get("/related", C.getRelatedCourses);
router.get("/mentor/:mentorId", C.getCoursesByMentor);
router.get("/reviews", C.getAllReviews);
router.get("/", C.getCourses);

/** ========= AUTHED / ROLE ========= */
// Danh sách khoá học của chính mentor đang đăng nhập
router.get(
  "/my-courses",
  verifyToken,
  authorizeRoles("mentor"),
  C.getMyCourses
);

// Kiểm tra xem user đã mua khóa học hay chưa
router.get(
  "/:courseId/purchase-status",
  verifyToken,
  C.checkCoursePurchaseStatus
);

// Route with params must be last
router.get("/:courseId", C.getCourseById);

// Tạo khoá học (mentor/admin)
router.post(
  "/",
  verifyToken,
  upload?.single ? upload.single("thumbnail") : upload,
  validate(createCourseSchema),
  authorizeRoles("mentor", "admin"),
  C.createCourse
);

// Cập nhật khoá học
router.put(
  "/:courseId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  upload?.single ? upload.single("thumbnail") : upload,
  validate(updateCourseSchema),
  C.updateCourse
);

// Xoá khoá học
router.delete(
  "/:courseId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  C.deleteCourse
);

// Đánh giá khoá học
router.post(
  "/:courseId/reviews",
  verifyToken,
  validate(addReviewSchema),
  C.addCourseReview
);
router.get("/:courseId/reviews", C.getCourseReviews);

// Thêm / xoá mentor của khoá
router.post(
  "/:courseId/mentors",
  verifyToken,
  authorizeRoles("admin"),
  validate(addMentorSchema),
  C.addMentorToCourse
);
router.delete(
  "/:courseId/mentors/:mentorId",
  verifyToken,
  authorizeRoles("admin"),
  C.removeMentorFromCourse
);

// Thêm / xoá content của khoá
router.post(
  "/:courseId/content",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  validate(addContentSchema),
  C.addContentToCourse
);
router.delete(
  "/:courseId/content/:contentId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  C.removeContentFromCourse
);

export default router;
