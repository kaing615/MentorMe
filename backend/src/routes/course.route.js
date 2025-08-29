import express from "express";
import * as CourseCtl from "../controllers/course.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import forceMentor from "../middlewares/forceMentor.middleware.js";
import upload from "../utils/multer.js";
import {
  createCourseSchema,
  updateCourseSchema,
  addMentorSchema,
  addContentSchema,
  addReviewSchema,
} from "../validations/course.validation.js"; // đúng: 'validations' theo file của bạn

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
    return res.status(400).json({ message: "Validation error", details: error.details });
  }
  req.body = { ...req.body, ...value };
  next();
};

/** ========= PUBLIC ========= */
router.get("/related", C.getRelatedCourses);
router.get("/mentor/:mentorId", C.getCoursesByMentor);
router.get("/", C.getCourses);
router.get("/:courseId", C.getCourseById);
router.get("/reviews", C.getAllReviews);
router.get("/related", C.getRelatedCourses);

/** ========= AUTHED / ROLE ========= */
// Danh sách khoá học của chính mentor đang đăng nhập
router.get(
  "/my-courses",
  verifyToken,
  authorizeRoles("mentor"),
  C.getMyCourses
);

// Tạo khoá học (mentor/admin)
router.post(
  "/",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  forceMentor, // nếu forceMentor kiểm tra đúng mentor, giữ lại; nếu không cần có thể bỏ
  upload?.single ? upload.single("thumbnail") : upload,
  validate(createCourseSchema),
  C.createCourse
);

// Cập nhật khoá học
router.put(
  "/:courseId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  forceMentor,
  upload?.single ? upload.single("thumbnail") : upload,
  validate(updateCourseSchema),
  C.updateCourse
);

// Xoá khoá học
router.delete(
  "/:courseId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  forceMentor,
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
  forceMentor,
  validate(addContentSchema),
  C.addContentToCourse
);
router.delete(
  "/:courseId/content/:contentId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  forceMentor,
  C.removeContentFromCourse
);

export default router;
