import express from "express";
import courseController from "../controllers/course.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         mentor:
 *           type: object
 *         category:
 *           type: string
 *         duration:
 *           type: number
 *         link:
 *           type: string
 *         lectures:
 *           type: number
 *         image:
 *           type: string
 *         files:
 *           type: array
 *         createdAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Get list of courses
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Current page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of courses per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */
// Public routes
router.get("/", courseController.getAllCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get("/:id", courseController.getCourseById);

/**
 * @swagger
 * /courses/mentor/{mentorId}:
 *   get:
 *     tags: [Courses]
 *     summary: Get courses by mentor
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mentor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Mentor courses retrieved successfully
 */
router.get("/mentor/:mentorId", courseController.getCoursesByMentor);

/**
 * @swagger
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create new course
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
 *               - description
 *               - price
 *               - image
 *               - files
 *             properties:
 *               title:
 *                 type: string
 *                 description: Course title
 *               description:
 *                 type: string
 *                 description: Course description
 *               price:
 *                 type: number
 *                 description: Course price
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Course image
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Course files (video, PDF, etc.)
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation error or missing files
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Protected routes (require authentication)
router.post("/", 
  tokenMiddleware.auth, 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'files', maxCount: 10 }
  ]), 
  courseController.createCourse
);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     tags: [Courses]
 *     summary: Update course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *   delete:
 *     tags: [Courses]
 *     summary: Delete course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 */
router.put("/:id", tokenMiddleware.auth, courseController.updateCourse);
router.delete("/:id", tokenMiddleware.auth, courseController.deleteCourse);

export default router;
