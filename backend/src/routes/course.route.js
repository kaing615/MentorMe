import express from "express";
import {
  getCourseDetails,
  addCourseReview,
  getCourseReviews,
  createCourse,
  addMentorToCourse,
  removeMentorFromCourse,
  addContentToCourse,
  removeContentFromCourse,
} from "../controllers/course.controller.js"; 
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management APIs
 */

/**
 * @swagger
 * /api/v1/courses/{courseId}:
 *   get:
 *     summary: Get course details by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to get
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get("/courses/:courseId", getCourseDetails);

/**
 * @swagger
 * /api/v1/courses/{courseId}/reviews:
 *   post:
 *     summary: Add a review to a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to add a review to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *   get:
 *     summary: Get all reviews for a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to get reviews for
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       404:
 *         description: Course not found
 */
router.post("/courses/:courseId/reviews", verifyToken, addCourseReview);
router.get("/courses/:courseId/reviews", getCourseReviews);

/**
 * @swagger
 * /api/v1/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/courses", verifyToken, createCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}/mentors:
 *   post:
 *     summary: Add a mentor to a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mentorId:
 *                 type: string
 *                 description: The ID of the mentor to add
 *             required:
 *               - mentorId
 *     responses:
 *       200:
 *         description: Mentor added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/courses/:courseId/mentors", verifyToken, addMentorToCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}/mentors/{mentorId}:
 *   delete:
 *     summary: Remove a mentor from a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the mentor to remove
 *     responses:
 *       200:
 *         description: Mentor removed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.delete("/courses/:courseId/mentors/:mentorId", verifyToken, removeMentorFromCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}/content:
 *   post:
 *     summary: Add content to a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContentInput'
 *     responses:
 *       201:
 *         description: Content added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/courses/:courseId/content", verifyToken, addContentToCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}/content/{contentId}:
 *   delete:
 *     summary: Remove content from a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course
 *       - in: path
 *         name: contentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the content to remove
 *     responses:
 *       200:
 *         description: Content removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.delete("/courses/:courseId/content/:contentId", verifyToken, removeContentFromCourse);

export default router;