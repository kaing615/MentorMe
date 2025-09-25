import express from "express";
import bookingController from "../controllers/booking.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

router.post(
  "/mentor/:mentorId",
  tokenMiddleware.auth,
  bookingController.createBooking
);
router.get("/", tokenMiddleware.auth, bookingController.getBookings);
router.get(
  "/mentor",
  tokenMiddleware.auth,
  bookingController.getBookingsOfMentor
);
router.get(
  "/mentee",
  tokenMiddleware.auth,
  bookingController.getBookingsOfMentee
);
router.post(
  "/confirm/:id",
  tokenMiddleware.auth,
  bookingController.confirmBooking
);
router.post(
  "/decline/:id",
  tokenMiddleware.auth,
  bookingController.declineBooking
);
router.post(
  "/cancel/:id",
  tokenMiddleware.auth,
  bookingController.cancelBooking
);
router.patch("/:id", tokenMiddleware.auth, bookingController.updateBooking);
router.delete("/:id", tokenMiddleware.auth, bookingController.deleteBooking);

export default router;
