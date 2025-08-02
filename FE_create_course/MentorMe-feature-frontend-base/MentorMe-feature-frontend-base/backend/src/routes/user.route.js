import express from "express";
import userValidator from "../middlewares/validators/user.middleware.js";
import upload from "../utils/multer.js"

import userController from "../controllers/user.controller.js";
import requestHandler from "../handlers/request.handler.js";
import parseSkillsMiddleware from "../middlewares/parseSkills.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /user/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a regular user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - userName
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful (please check email for verification)
 *       400:
 *         description: Validation error or registration failed
 */
router.post(
    "/signup",
    userValidator.signUpValidator,
    requestHandler.validate,
    userController.signUp
);

/**
 * @swagger
 * /user/signupMentor:
 *   post:
 *     tags: [Auth]
 *     summary: Register a mentor account (with avatar upload)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - userName
 *               - email
 *               - password
 *               - confirmPassword
 *               - jobTitle
 *               - location
 *               - category
 *               - skills
 *               - bio
 *               - mentorReason
 *               - greatestAchievement
 *               - avatar
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               bio:
 *                 type: string
 *               linkedinUrl:
 *                 type: string
 *                 format: uri
 *               mentorReason:
 *                 type: string
 *               greatestAchievement:
 *                 type: string
 *               introVideo:
 *                 type: string
 *                 format: uri
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Mentor registration successful
 *       400:
 *         description: Validation error or registration failed
 */
router.post(
    "/signupMentor",
    upload.single('avatar'),
    parseSkillsMiddleware,
    userValidator.signUpMentorValidator,
    requestHandler.validate,
    userController.signUpMentor
)

/**
 * @swagger
 * /user/signin:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in (for both mentor/mentee)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sign in successful
 *       400:
 *         description: Invalid email or password
 */
router.post(
    "/signin",
    userValidator.signInValidator,
    requestHandler.validate,
    userController.signIn
)

/**
 * @swagger
 * /user/verify:
 *   get:
 *     tags: [Auth]
 *     summary: Verify email from link sent to email
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: verifyKey
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Email verification successful
 *       400:
 *         description: Email verification error
 */
router.get("/verify", userController.verifyEmail);

/**
 * @swagger
 * /user/resend-verification-email:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email resent successfully
 *       400:
 *         description: User not found or already verified
 */
router.post(
	"/resend-verification-email",
	userValidator.resendEmailValidator,
	requestHandler.validate,
	userController.resendVerificationEmail
);

/**
 * @swagger
 * /user/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (if user exists)
 *       400:
 *         description: User not found error
 */
router.post(
	"/forgot-password",
	userValidator.forgotPasswordValidator,
	requestHandler.validate,
	userController.forgotPassword
);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or validation error
 */
router.post(
	"/reset-password",
	userValidator.resetPasswordValidator,
	requestHandler.validate,
	userController.resetPassword
);

export default router;