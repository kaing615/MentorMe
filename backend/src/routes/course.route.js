import express from "express";
import {
  getCourseDetails,
  addCourseReview,
  getCourseReviews,
  createCourse,
  updateCourse,
  deleteCourse,
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
 * /api/courses/{courseId}:
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
 * /api/courses/{courseId}/reviews:
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
 *       403:
 *         description: Forbidden (e.g., user not enrolled)
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
 * /api/courses:
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
 *       403:
 *         description: Forbidden (user does not have required role)
 */
router.post("/courses", verifyToken, authorizeRoles('admin', 'mentor'), createCourse);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   put:
 *     summary: Update course details by ID
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
 *             $ref: '#/components/schemas/CourseUpdateInput' 
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
         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not have permission)
 *       404:
 *         description: Course not found
 *   delete:
 *     summary: Delete a course by ID
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not have permission)
 *       404:
 *         description: Course not found
 */
router.put("/courses/:courseId", verifyToken, authorizeRoles('admin', 'mentor'), updateCourse);
router.delete("/courses/:courseId", verifyToken, authorizeRoles('admin', 'mentor'), deleteCourse);

/**
 * @swagger
 * /api/courses/{courseId}/mentors:
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
 *         description: The ID of the course to add a mentor to
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course' # Trả về thông tin khóa học đã cập nhật
 *       400:
 *         description: Invalid input or mentor already assigned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not have permission)
 *       404:
 *         description: Course or Mentor not found
 */
router.post("/courses/:courseId/mentors", verifyToken, authorizeRoles('admin', 'mentor'), addMentorToCourse);

/**
 * @swagger
 * /api/courses/{courseId}/mentors/{mentorId}:
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course' # Trả về thông tin khóa học đã cập nhật
 *       400:
 *         description: Mentor not assigned to this course
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not have permission)
 *       404:
 *         description: Course not found
 */
router.delete("/courses/:courseId/mentors/:mentorId", verifyToken, authorizeRoles('admin', 'mentor'), removeMentorFromCourse);

/**
 * @swagger
 * /api/courses/{courseId}/content:
 *   post:
 *     summary: Add content (lesson) to a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course to add content to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LessonInput' # Cần định nghĩa schema LessonInput
 *     responses:
 *       201:
 *         description: Content added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course' # Trả về thông tin khóa học đã cập nhật
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not have permission)
 *       404:
 *         description: Course not found
 */
router.post("/courses/:courseId/content", verifyToken, authorizeRoles('admin', 'mentor'), addContentToCourse);

/**
 * @swagger
 * /api/courses/{courseId}/content/{contentId}:
 *   delete:
 *     summary: Remove content (lesson) from a course
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
 *         description: The ID of the content (lesson) to remove
 *     responses:
 *       200:
 *         description: Content removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course' # Trả về thông tin khóa học đã cập nhật
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not have permission)
 *       404:
 *         description: Course or Content not found
 */
router.delete("/courses/:courseId/content/:contentId", verifyToken, authorizeRoles('admin', 'mentor'), removeContentFromCourse);

export default router;
