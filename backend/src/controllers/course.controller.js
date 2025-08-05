<<<<<<< HEAD
import Course from "../models/course.model.js";

const courseController = {
  // Create a new course
  createCourse: async (req, res) => {
    try {
      console.log('Request body:', req.body);
      
      const { title, description, price, category, level, duration, lectures, driveLink } = req.body;
      const userId = req.user.id; // Get mentor ID from authenticated user

      // Validate required fields (duration is optional, link is not needed)
      if (!title || !description || !price || !category || !level || !lectures || !driveLink) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided: title, description, price, category, level, lectures, driveLink"
        });
      }

      // Create new course (no file upload needed)
      const newCourse = new Course({
        title,
        description,
        price: parseFloat(price),
        category,
        level,
        duration: duration ? parseInt(duration) : null, // Optional field
        lectures: parseInt(lectures),
        driveLink, // Google Drive link for materials
        mentor: userId,
        image: null, // No image upload for now
        files: [] // No file upload needed
      });

      const savedCourse = await newCourse.save();

      // Populate mentor information
      await savedCourse.populate('mentor', 'username email');

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: savedCourse
      });

    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: "Error creating course",
        error: error.message
      });
    }
  },

  // Get all courses
  getAllCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, category, search } = req.query;
      
      let query = {};
      
      if (category) {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const courses = await Course.find(query)
        .populate('mentor', 'username email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Course.countDocuments(query);

      res.json({
        success: true,
        data: courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching courses",
        error: error.message
      });
    }
  },

  // Get course by ID
  getCourseById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const course = await Course.findById(id)
        .populate('mentor', 'username email')
        .populate('mentees', 'username email');

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching course",
        error: error.message
      });
    }
  },

  // Get courses by mentor
  getCoursesByMentor: async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const courses = await Course.find({ mentor: mentorId })
        .populate('mentor', 'username email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Course.countDocuments({ mentor: mentorId });

      res.json({
        success: true,
        data: courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      });
    } catch (error) {
      console.error('Get mentor courses error:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching mentor courses",
        error: error.message
      });
    }
  },

  // Update course
  updateCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Check if user is the mentor of this course
      if (course.mentor.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this course"
        });
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        { ...req.body },
        { new: true, runValidators: true }
      ).populate('mentor', 'username email');

      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: "Error updating course",
        error: error.message
      });
    }
  },

  // Delete course
  deleteCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Check if user is the mentor of this course
      if (course.mentor.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this course"
        });
      }

      await Course.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Course deleted successfully"
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: "Error deleting course",
        error: error.message
      });
    }
  }
};

export default courseController;
=======
import responseHandler from "../handlers/response.handler.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Lesson from "../models/lesson.model.js";
import Review from "../models/review.model.js";
import mongoose from "mongoose"; 
import { 
  createCourseSchema, 
  updateCourseSchema, 
  addMentorSchema, 
  addContentSchema, 
  addReviewSchema 
} from "../validation/course.validation.js"; // Sửa path từ validations thành validation

const isMentorOfCourse = (course, userId) => {
  return course.mentors.some(mentorId => mentorId.toString() === userId.toString());
};

// [GET] /api/users/:userId/courses
export const getUserCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, search, sortBy, filterBy, page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notFound(res, "User not found.");
    }

    let query = {};

    if (role === 'mentee') {
      query = { mentees: userId };
    } else if (role === 'mentor') {
      query = { mentors: userId };
    } else {
      return responseHandler.badRequest(res, "Invalid role specified.");
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let sortOptions = {};
    if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'rating') {
      sortOptions = { averageRating: -1 }; 
    } else if (sortBy === 'priceAsc') {
      sortOptions = { price: 1 }; 
    } else if (sortBy === 'priceDesc') {
      sortOptions = { price: -1 }; 
    } else {
      // Mặc định
    }

    // Add filter logic based on filterBy
    if (filterBy) {
      try {
        const filters = JSON.parse(filterBy); 
        if (filters.category) {
          query.category = filters.category;
        }
        if (filters.priceMin) {
            query.price = { ...query.price, $gte: filters.priceMin };
        }
        if (filters.priceMax) {
            query.price = { ...query.price, $lte: filters.priceMax };
        }
        // Thêm các điều kiện lọc khác
      } catch (parseError) {
        console.error("Error parsing filterBy JSON:", parseError);
        return responseHandler.badRequest(res, "Invalid filterBy format.");
      }
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .populate('mentors', 'userName avatar')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limit);

    return responseHandler.ok(res, {
      courses,
      totalCourses,
      totalPages,
      currentPage: parseInt(page),
    });

  } catch (err) {
    console.error("Error getting user courses:", err);
    responseHandler.error(res);
  }
};

// [GET] /api/courses/:courseId
export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('mentors', 'userName avatar')
      .populate('lessons');

    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    return responseHandler.ok(res, course);

  } catch (err) {
    console.error("Error getting course details:", err);
    responseHandler.error(res);
  }
};

// [POST] /api/courses/:courseId/reviews
export const addCourseReview = async (req, res) => {
  try {
    // Validate dữ liệu đầu vào
    const { error } = addReviewSchema.validate(req.body);
    if (error) {
      return responseHandler.badRequest(res, error.details[0].message);
    }

    const { courseId } = req.params;
    const authorId = req.user.id; 
    const { rating, comment } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const isMenteeOfCourse = course.mentees.includes(authorId);
    if (!isMenteeOfCourse) {
      return responseHandler.forbidden(res, "You can only review courses you are enrolled in.");
    }

    const existingReview = await Review.findOne({ 
      author: authorId, 
      target: courseId, 
      targetType: "Course" 
    });
    if (existingReview) {
      return responseHandler.badRequest(res, "You have already reviewed this course.");
    }

    const newReview = new Review({
      author: authorId,
      targetType: "Course",
      target: courseId,
      content: comment,
      rate: rating,
    });

    await newReview.save();

    const reviews = await Review.find({ target: courseId, targetType: "Course" });
    const totalRatings = reviews.reduce((sum, review) => sum + review.rate, 0);
    course.averageRating = totalRatings / reviews.length; 
    course.numberOfRatings = reviews.length;

    await course.save();

    return responseHandler.created(res, newReview);

  } catch (err) {
    console.error("Error adding course review:", err);
    responseHandler.error(res);
  }
};

// [GET] /api/courses/:courseId/reviews
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({ target: courseId, targetType: "Course" })
      .populate('author', 'userName avatar');

    return responseHandler.ok(res, reviews);

  } catch (err) {
    console.error("Error getting course reviews:", err);
    responseHandler.error(res);
  }
};

// [POST] /api/courses
export const createCourse = async (req, res) => {
  try {
    // Validate dữ liệu đầu vào
    const { error } = createCourseSchema.validate(req.body);
    if (error) {
      return responseHandler.badRequest(res, error.details[0].message);
    }

    const creatorId = req.user.id; 
    const { name, description, shortDescription, thumbnail, price, category, tags, duration, link, lectures, mentors } = req.body;

    // Quyền tạo khóa học đã được kiểm tra bởi authorizeRoles('admin', 'mentor')

    const newCourse = new Course({ ...req.body, mentors: mentors || [creatorId] }); 

    await newCourse.save();

    // Cập nhật thông tin khóa học vào model User của các mentor
    if (newCourse.mentors && newCourse.mentors.length > 0) {
      await User.updateMany(
        { _id: { $in: newCourse.mentors } },
        { $push: { courses: newCourse._id } } 
      );
    }

    return responseHandler.created(res, newCourse);

  } catch (err) {
    console.error("Error creating course:", err);
    responseHandler.error(res);
  }
};

// [PUT] /api/courses/:courseId
export const updateCourse = async (req, res) => {
  try {
    // Validate dữ liệu đầu vào
    const { error } = updateCourseSchema.validate(req.body);
    if (error) {
      return responseHandler.badRequest(res, error.details[0].message);
    }

    const { courseId } = req.params;
    const userId = req.user.id; 
    const updateData = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const user = await User.findById(userId);
    if (user.role !== 'admin' && !isMentorOfCourse(course, userId)) {
       return responseHandler.forbidden(res, "You do not have permission to update this course.");
    }

    const oldMentors = course.mentors.map(mentorId => mentorId.toString());

    Object.assign(course, updateData);

    await course.save();

    const newMentors = course.mentors.map(mentorId => mentorId.toString());

    const removedMentors = oldMentors.filter(mentorId => !newMentors.includes(mentorId));

    const addedMentors = newMentors.filter(mentorId => !oldMentors.includes(mentorId));

    if (removedMentors.length > 0) {
      await User.updateMany(
        { _id: { $in: removedMentors } },
        { $pull: { courses: courseId } }
      );
    }

    if (addedMentors.length > 0) {
       await User.updateMany(
        { _id: { $in: addedMentors } },
        { $push: { courses: courseId } }
      );
    }

    return responseHandler.ok(res, course);

  } catch (err) {
    console.error("Error updating course:", err);
    responseHandler.error(res);
  }
};

// [DELETE] /api/courses/:courseId
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id; 

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const user = await User.findById(userId);
    if (user.role !== 'admin' && !isMentorOfCourse(course, userId)) {
       return responseHandler.forbidden(res, "You do not have permission to delete this course.");
    }

    const mentorsOfCourse = course.mentors;
    const menteesOfCourse = course.mentees;

    await Course.findByIdAndDelete(courseId);

    await Lesson.deleteMany({ course: courseId });
    await Review.deleteMany({ target: courseId, targetType: "Course" });

    if (mentorsOfCourse && mentorsOfCourse.length > 0) {
      await User.updateMany(
        { _id: { $in: mentorsOfCourse } },
        { $pull: { courses: courseId } }
      );
    }

    if (menteesOfCourse && menteesOfCourse.length > 0) {
      await User.updateMany(
        { _id: { $in: menteesOfCourse } },
        { $pull: { courses: courseId } } 
      );
    }

    return responseHandler.ok(res, { message: "Course deleted successfully." });

  } catch (err) {
    console.error("Error deleting course:", err);
    responseHandler.error(res);
  }
};

// [POST] /api/courses/:courseId/mentors
export const addMentorToCourse = async (req, res) => {
  try {
    // Validate dữ liệu đầu vào
    const { error } = addMentorSchema.validate(req.body);
    if (error) {
      return responseHandler.badRequest(res, error.details[0].message);
    }

    const { courseId } = req.params;
    const userId = req.user.id; 
    const { mentorId } = req.body; 

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const user = await User.findById(userId);
    if (user.role !== 'admin' && !isMentorOfCourse(course, userId)) {
       return responseHandler.forbidden(res, "You do not have permission to add mentors to this course.");
    }

    const mentorToAdd = await User.findById(mentorId);
    if (!mentorToAdd || !mentorToAdd.roles.includes('mentor')) {
      return responseHandler.badRequest(res, "Invalid mentor ID or user is not a mentor.");
    }

    if (course.mentors.includes(mentorId)) {
      return responseHandler.badRequest(res, "Mentor is already assigned to this course.");
    }

    course.mentors.push(mentorId);
    await course.save();

    // Thêm ID khóa học vào model User của mentor mới
    await User.findByIdAndUpdate(
      mentorId,
      { $push: { courses: courseId } } 
    );

    const updatedCourse = await Course.findById(courseId).populate('mentors', 'userName avatar');

    return responseHandler.ok(res, updatedCourse);

  } catch (err) {
    console.error("Error adding mentor to course:", err);
    responseHandler.error(res);
  }
};

// [DELETE] /api/courses/:courseId/mentors/:mentorId
export const removeMentorFromCourse = async (req, res) => {
  try {
    // Không cần validate body ở đây vì mentorId nằm trong params

    const { courseId, mentorId } = req.params;
    const userId = req.user.id; 

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const user = await User.findById(userId);
    if (user.role !== 'admin' && !isMentorOfCourse(course, userId)) {
       return responseHandler.forbidden(res, "You do not have permission to remove mentors from this course.");
    }

    const mentorIndex = course.mentors.indexOf(mentorId);
    if (mentorIndex === -1) {
      return responseHandler.badRequest(res, "Mentor is not assigned to this course.");
    }

    course.mentors.splice(mentorIndex, 1);
    await course.save();

    // Xóa ID khóa học khỏi model User của mentor bị xóa
     await User.findByIdAndUpdate(
      mentorId,
      { $pull: { courses: courseId } } 
    );

    const updatedCourse = await Course.findById(courseId).populate('mentors', 'userName avatar');

    return responseHandler.ok(res, updatedCourse);

  } catch (err) {
    console.error("Error removing mentor from course:", err);
    responseHandler.error(res);
  }
};

// [POST] /api/courses/:courseId/content
export const addContentToCourse = async (req, res) => {
  try {
    // Validate dữ liệu đầu vào
    const { error } = addContentSchema.validate(req.body);
    if (error) {
      return responseHandler.badRequest(res, error.details[0].message);
    }

    const { courseId } = req.params;
    const userId = req.user.id; 
    const contentData = req.body; 

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const user = await User.findById(userId);
    if (user.role !== 'admin' && !isMentorOfCourse(course, userId)) {
       return responseHandler.forbidden(res, "You do not have permission to add content to this course.");
    }

    const newLesson = new Lesson({
      ...contentData,
      course: courseId, 
    });

    await newLesson.save();

    course.lessons.push(newLesson._id);
    await course.save();

    const updatedCourse = await Course.findById(courseId).populate('lessons');

    return responseHandler.created(res, updatedCourse);

  } catch (err) {
    console.error("Error adding content to course:", err);
    responseHandler.error(res);
  }
};

// [DELETE] /api/courses/:courseId/content/:contentId
export const removeContentFromCourse = async (req, res) => {
  try {
    // Không cần validate body ở đây vì contentId nằm trong params

    const { courseId, contentId } = req.params;
    const userId = req.user.id; 

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const user = await User.findById(userId);
    if (user.role !== 'admin' && !isMentorOfCourse(course, userId)) {
       return responseHandler.forbidden(res, "You do not have permission to remove content from this course.");
    }

    const lesson = await Lesson.findOne({ _id: contentId, course: courseId });
    if (!lesson) {
      return responseHandler.notFound(res, "Content not found in this course.");
    }

    await Lesson.findByIdAndDelete(contentId);

    course.lessons = course.lessons.filter(lessonId => lessonId.toString() !== contentId.toString());
    await course.save();

    const updatedCourse = await Course.findById(courseId).populate('lessons');

    return responseHandler.ok(res, updatedCourse);

  } catch (err) {
    console.error("Error removing content from course:", err);
    responseHandler.error(res);
  }
};

export default {
  getUserCourses,
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
};
>>>>>>> feature/courseCreate-BE
