// backend/src/routes/user.route.js
import express from "express";
import * as UserCtl from "../controllers/user.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import upload from "../utils/multer.js";

import {
  signUpSchema,
  signUpMentorSchema,
  signInSchema,
  verifyEmailSchema,
  resendEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/user.validation.js";

const router = express.Router();

// Gộp cả named lẫn default export để không bị undefined
const U = { ...UserCtl, ...(UserCtl.default || {}) };

// Joi -> middleware validate
const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const src = req.method === "GET" ? { ...req.query, ...req.params } : { ...req.body, ...req.params, ...req.query };
  const { error, value } = schema.validate(src, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({ message: "Validation error", details: error.details });
  }
  // Không thể gán trực tiếp req.query vì nó là read-only
  // Thay vào đó ta sẽ tạo property mới hoặc gán từng property
  if (req.method === "GET") {
    req.validatedQuery = value;
  } else {
    req.body = value;
  }
  next();
};

// ===== PUBLIC AUTH =====
if (typeof U.signUp !== "function") throw new Error("user.controller.js is missing: signUp");
if (typeof U.signIn !== "function") throw new Error("user.controller.js is missing: signIn");
if (typeof U.signUpMentor !== "function") throw new Error("user.controller.js is missing: signUpMentor");

router.post("/signup", validate(signUpSchema), U.signUp);
router.post("/signin", validate(signInSchema), U.signIn);
router.post("/signupMentor", upload.single("avatar"), validate(signUpMentorSchema), U.signUpMentor);

if (typeof U.verifyEmail === "function")
  router.get("/verify", validate(verifyEmailSchema), U.verifyEmail);

if (typeof U.resendEmail === "function")
  router.post("/resend-email", validate(resendEmailSchema), U.resendEmail);

if (typeof U.forgotPassword === "function")
  router.post("/forgot-password", validate(forgotPasswordSchema), U.forgotPassword);

if (typeof U.resetPassword === "function")
  router.post("/reset-password", validate(resetPasswordSchema), U.resetPassword);

// ===== PROTECTED USER =====
const maybeUpload = upload?.single ? upload.single("avatar") : (req, _res, next) => next();

if (typeof U.getMe === "function" || typeof U.getProfile === "function") {
  router.get("/me", tokenMiddleware.auth, (U.getMe || U.getProfile));
}

if (typeof U.changeAvatar === "function") {
  router.post("/avatar", tokenMiddleware.auth, maybeUpload, U.changeAvatar);
}

export default router;