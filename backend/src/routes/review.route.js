import express from "express";
import tokenMiddleware from "../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../middlewares/joi.middleware.js";
import * as reviewController from "../controllers/review.controller.js";
import * as reviewValidation from "../validations/review.validation.js";

const router = express.Router();

// POST /reviews - create
router.post(
  "/",
  tokenMiddleware.auth,
  validateBody(reviewValidation.createReviewBody),
  reviewController.createReview
);

//GET /reviews - list
router.get(
  "/",
  tokenMiddleware.auth,
  validateQuery(reviewValidation.getReviewsQuery),
  reviewController.getReviews
);

//GET /reviews/my - get reviews by current user (mentee's own reviews)
router.get("/my", tokenMiddleware.auth, reviewController.getMyReviews);

//GET /reviews/booking/:mentorId - get booking reviews for mentor
router.get(
  "/booking/:mentorId",
  tokenMiddleware.auth,
  reviewController.getBookingReview
);

//PATCH /reviews/:id - update
router.patch(
  "/:id",
  tokenMiddleware.auth,
  validateBody(reviewValidation.updateReviewBody),
  reviewController.updateReview
);

//DELETE /reviews/:id - delete
router.delete("/:id", tokenMiddleware.auth, reviewController.deleteReview);

export default router;
