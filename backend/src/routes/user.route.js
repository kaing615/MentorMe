import express from "express";
import userValidator from "../middlewares/validators/user.middleware.js";
import upload from "../utils/multer.js"

import userController from "../controllers/user.controller.js";
import requestHandler from "../handlers/request.handler.js";
import parseSkillsMiddleware from "../middlewares/parseSkills.middleware.js";

const router = express.Router();

router.post(
    "/signup",
    userValidator.signUpValidator,
    requestHandler.validate,
    userController.signUp
);

router.post(
    "/signupMentor",
    upload.single('avatar'),
    parseSkillsMiddleware,
    userValidator.signUpMentorValidator,
    requestHandler.validate,
    userController.signUpMentor
)

router.post(
    "/signin",
    userValidator.signInValidator,
    requestHandler.validate,
    userController.signIn
)

router.get("/verify", userController.verifyEmail);

router.post(
	"/resend-verification-email",
	userValidator.resendEmailValidator,
	requestHandler.validate,
	userController.resendVerificationEmail
);

router.post(
	"/forgot-password",
	userValidator.forgotPasswordValidator,
	requestHandler.validate,
	userController.forgotPassword
);

router.post(
	"/reset-password",
	userValidator.resetPasswordValidator,
	requestHandler.validate,
	userController.resetPassword
);

export default router;