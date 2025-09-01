import express from "express";
import availabilityController from "../controllers/availability.controller.js";
import { validateBody, validateQuery } from "../middlewares/joi.middleware.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import * as availabilityValidation from "../validations/availability.validation.js";

const router = express.Router();

/**
 * @route   POST /api/availability
 * @desc    Mentor tạo hoặc cập nhật availability cho một ngày
 * @access  Private (Mentor only)
 */
router.post(
  "/",
  tokenMiddleware.auth,
  validateBody(availabilityValidation.createAvailabilitySchema),
  availabilityController.createOrUpdateAvailability
);

/**
 * @route   GET /api/availability
 * @desc    Lấy availability của mentor cho một ngày cụ thể (chỉ mentor xem của chính mình)
 * @access  Private (Mentor only)
 */
router.get(
  "/",
  tokenMiddleware.auth,
  validateQuery(availabilityValidation.getAvailabilitySchema),
  availabilityController.getAvailability
);

/**
 * @route   GET /api/availability/today-schedule
 * @desc    Lấy lịch chi tiết trong ngày của mentor (với thống kê)
 * @access  Private (Mentor only)
 */
router.get(
  "/today-schedule",
  tokenMiddleware.auth,
  validateQuery(availabilityValidation.getAvailabilitySchema),
  availabilityController.getTodaySchedule
);

/**
 * @route   GET /api/availability/mentor/range
 * @desc    Lấy availability của mentor trong khoảng thời gian
 * @access  Private (Mentor only)
 */
router.get(
  "/mentor/range",
  tokenMiddleware.auth,
  validateQuery(availabilityValidation.getAvailabilityRangeSchema),
  availabilityController.getMentorAvailabilityRange
);

/**
 * @route   GET /api/availability/overview
 * @desc    Lấy availability overview của mentor trong 7 ngày tới
 * @access  Private (Mentor only)
 */
router.get(
  "/overview",
  tokenMiddleware.auth,
  validateQuery(availabilityValidation.getAvailabilityOverviewSchema),
  availabilityController.getAvailabilityOverview
);

/**
 * @route   DELETE /api/availability/:availabilityId
 * @desc    Xóa availability (chỉ khi không có booking active)
 * @access  Private (Mentor only)
 */
router.delete(
  "/:availabilityId",
  tokenMiddleware.auth,
  availabilityController.deleteAvailability
);

/**
 * @route   POST /api/availability/cleanup-old
 * @desc    Manual cleanup of old availability records (Admin only)
 * @access  Private (Admin only)
 */
router.post(
  "/cleanup-old",
  tokenMiddleware.auth,
  // Note: Add admin role middleware if needed
  availabilityController.manualCleanupOldAvailabilities
);

export default router;
