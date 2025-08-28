import express from "express";
import { createBooking, getBookings, updateBooking, deleteBooking } from "../controllers/booking.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Đặt lịch hẹn
router.post("/bookings", verifyToken, createBooking);
// Lấy danh sách lịch hẹn (theo mentor/mentee/date)
router.get("/bookings", verifyToken, getBookings);
// Cập nhật trạng thái/ghi chú lịch hẹn
router.patch("/bookings/:id", verifyToken, updateBooking);
// Xóa lịch hẹn
router.delete("/bookings/:id", verifyToken, deleteBooking);

export default router;
