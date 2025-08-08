import express from "express";
import {
  getAllCourses,
  getMyCourses,
  getCourseDetails,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseReview,
  getCourseReviews,
  getAllReviews,
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
 * /api/v1/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search courses by name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, rating, priceAsc, priceDesc]
 *         description: Sort courses by criteria
 *       - in: query
 *         name: filterBy
 *         schema:
 *           type: string
 *         description: JSON string for filtering (category, priceMin, priceMax)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of courses per page
 *     responses:
 *       200:
 *         description: List of courses with pagination
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
 */
router.get("/", getAllCourses);

/**
 * @swagger
 * /api/v1/courses/my-courses:
 *   get:
 *     summary: Get courses created by the current mentor
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by course title
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, rating, priceAsc, priceDesc]
 *         description: Sort courses
 *       - in: query
 *         name: filterBy
 *         schema:
 *           type: string
 *         description: JSON string with filter criteria
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of courses per page
 *     responses:
 *       200:
 *         description: List of mentor's courses
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
 *         description: Unauthorized - Only mentors can access their courses
 *       404:
 *         description: User not found
 */
router.get("/my-courses", verifyToken, authorizeRoles(['mentor']), getMyCourses);

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
router.get("/:courseId", getCourseDetails);

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
router.post("/:courseId/reviews", verifyToken, addCourseReview);
router.get("/:courseId/reviews", getCourseReviews);

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
router.post("/", verifyToken, createCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}:
 *   put:
 *     summary: Update a course (only by course mentor)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only course mentor can update this course
 *       404:
 *         description: Course not found
 *   delete:
 *     summary: Delete a course (only by course mentor)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to delete
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only course mentor can delete this course
 *       404:
 *         description: Course not found
 */
router.put("/:courseId", verifyToken, updateCourse);
router.delete("/:courseId", verifyToken, deleteCourse);

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
router.post("/:courseId/mentors", verifyToken, addMentorToCourse);

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
router.delete("/:courseId/mentors/:mentorId", verifyToken, removeMentorFromCourse);

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
router.post("/:courseId/content", verifyToken, addContentToCourse);

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
router.delete("/:courseId/content/:contentId", verifyToken, removeContentFromCourse);

export default router;