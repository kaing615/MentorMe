import express from "express";
import {
  createNewCourse,
  getCourseFormData,
  getMyCourses,
  validateCourseData
} from "../controllers/createcourse.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validateCreateCourse, validateCourseData as validateCourseDataMiddleware } from "../middlewares/createcourse.middleware.js";
import { handleCourseImageUpload } from "../middlewares/upload.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Create Course
 *   description: APIs for creating new courses
 */

/**
 * @swagger
 * /api/create-course:
 *   post:
 *     summary: Create a new course
 *     tags: [Create Course]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - category
 *               - level
 *               - lectures
 *               - courseOverview
 *               - keyLearningObjectives
 *               - driveLink
 *               - thumbnail
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Course title
 *                 example: "Complete JavaScript Course"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Course price in USD
 *                 example: 99.99
 *               category:
 *                 type: string
 *                 description: Course category
 *                 example: "Programming"
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced, Expert]
 *                 description: Course difficulty level
 *                 example: "Intermediate"
 *               lectures:
 *                 type: integer
 *                 minimum: 1
 *                 description: Total number of lectures
 *                 example: 25
 *               duration:
 *                 type: number
 *                 minimum: 0
 *                 description: Course duration in hours (optional)
 *                 example: 10.5
 *               courseOverview:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Comprehensive overview of the course
 *                 example: "This course will teach you everything about JavaScript..."
 *               keyLearningObjectives:
 *                 type: string
 *                 maxLength: 500
 *                 description: Main learning objectives students will achieve
 *                 example: "Master JavaScript fundamentals, Build real projects..."
 *               driveLink:
 *                 type: string
 *                 format: uri
 *                 description: Google Drive link for course materials
 *                 example: "https://drive.google.com/drive/folders/..."
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Course thumbnail image (required)
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course created successfully"
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only mentors can create courses
 */
router.post("/", verifyToken, authorizeRoles('mentor'), handleCourseImageUpload, validateCreateCourse, createNewCourse);

/**
 * @swagger
 * /api/create-course/form-data:
 *   get:
 *     summary: Get form configuration data for creating a course
 *     tags: [Create Course]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Form configuration data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Programming", "Design", "Business"]
 *                 levels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                       label:
 *                         type: string
 *                   example: [{"value": "Beginner", "label": "Beginner"}]
 *                 validation:
 *                   type: object
 *                   description: Validation rules for form fields
 *       401:
 *         description: Unauthorized
 */
router.get("/form-data", verifyToken, getCourseFormData);

/**
 * @swagger
 * /api/create-course/my-courses:
 *   get:
 *     summary: Get courses created by the current user
 *     tags: [Create Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of courses per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter courses by status
 *     responses:
 *       200:
 *         description: List of user's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *                 totalCourses:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/my-courses", verifyToken, getMyCourses);

/**
 * @swagger
 * /api/create-course/validate:
 *   post:
 *     summary: Validate course data before submission
 *     tags: [Create Course]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               level:
 *                 type: string
 *               lectures:
 *                 type: integer
 *               duration:
 *                 type: number
 *               courseOverview:
 *                 type: string
 *               keyLearningObjectives:
 *                 type: string
 *               driveLink:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation passed"
 *                 isValid:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.post("/validate", verifyToken, validateCourseDataMiddleware, validateCourseData);

export default router;
