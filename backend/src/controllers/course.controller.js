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
  return course.mentor && course.mentor.toString() === userId.toString();
};

// [GET] /api/courses - Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const { search, sortBy, filterBy, page = 1, limit = 10 } = req.query;

    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sortOptions = {};
    if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'rating') {
      sortOptions = { rate: -1 }; 
    } else if (sortBy === 'priceAsc') {
      sortOptions = { price: 1 }; 
    } else if (sortBy === 'priceDesc') {
      sortOptions = { price: -1 }; 
    } else {
      // Default sort by newest
      sortOptions = { createdAt: -1 };
    }

    // Add filter logic based on filterBy
    if (filterBy) {
      try {
        const filters = JSON.parse(filterBy); 
        if (filters.category) {
          query.category = filters.category;
        }
        if (filters.priceMin || filters.priceMax) {
          query.price = {};
          if (filters.priceMin) {
            query.price.$gte = filters.priceMin;
          }
          if (filters.priceMax) {
            query.price.$lte = filters.priceMax;
          }
        }
      } catch (parseError) {
        console.error("Error parsing filterBy JSON:", parseError);
        return responseHandler.badRequest(res, "Invalid filterBy format.");
      }
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .populate('mentor', 'userName avatar')
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
    console.error("Error getting all courses:", err);
    responseHandler.error(res);
  }
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
      query = { mentor: userId }; // Fix: use singular mentor field
    } else {
      return responseHandler.badRequest(res, "Invalid role specified.");
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sortOptions = {};
    if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'rating') {
      sortOptions = { rate: -1 }; 
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
      .populate('mentor', 'userName avatar')
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

// [GET] /api/courses/my-courses - Get courses created by the current mentor
export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, sortBy, filterBy, page = 1, limit = 10 } = req.query;

    // Verify user exists and is a mentor
    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notFound(res, "User not found.");
    }

    if (user.role !== 'mentor') {
      return responseHandler.unauthorized(res, "Only mentors can access their courses.");
    }

    let query = { mentor: userId };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sortOptions = {};
    if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'rating') {
      sortOptions = { rate: -1 };
    } else if (sortBy === 'priceAsc') {
      sortOptions = { price: 1 };
    } else if (sortBy === 'priceDesc') {
      sortOptions = { price: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    // Add filter logic
    if (filterBy) {
      try {
        const filters = JSON.parse(filterBy);
        if (filters.category) {
          query.category = filters.category;
        }
        if (filters.status) {
          query.status = filters.status;
        }
        if (filters.priceMin) {
          query.price = { ...query.price, $gte: filters.priceMin };
        }
        if (filters.priceMax) {
          query.price = { ...query.price, $lte: filters.priceMax };
        }
      } catch (parseError) {
        console.error("Error parsing filterBy JSON:", parseError);
        return responseHandler.badRequest(res, "Invalid filterBy format.");
      }
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .populate('mentor', 'userName avatar')
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
    console.error("Error getting my courses:", err);
    responseHandler.error(res);
  }
};

// [GET] /api/courses/:courseId
export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('mentor', 'userName avatar')
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
    course.rate = totalRatings / reviews.length; 
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
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    // Validate dữ liệu đầu vào
    const { error } = createCourseSchema.validate(req.body);
    if (error) {
      return responseHandler.badRequest(res, error.details[0].message);
    }

    const creatorId = req.user.id; 
    const { 
      title, 
      price, 
      courseOverview, 
      keyLearningObjectives, 
      category, 
      level, 
      lectures, 
      duration, 
      driveLink 
    } = req.body;

    // Get thumbnail from uploaded file
    const thumbnail = req.file ? req.file.path : null;
    
    if (!thumbnail) {
      return responseHandler.badRequest(res, "Course thumbnail is required");
    }

    // Quyền tạo khóa học đã được kiểm tra bởi authorizeRoles('admin', 'mentor')

    const newCourse = new Course({ 
      title: title, // Giữ nguyên field title
      description: courseOverview,
      shortDescription: keyLearningObjectives,
      thumbnail,
      price: parseFloat(price),
      category,
      level,
      lectures: parseInt(lectures),
      duration: duration ? parseInt(duration) : undefined,
      link: driveLink, // Map driveLink to link
      mentor: creatorId, // Use singular mentor field
      rate: 0,
      numberOfRatings: 0,
      status: 'published'
    }); 

    await newCourse.save();

    // Cập nhật thông tin khóa học vào model User của mentor
    await User.findByIdAndUpdate(
      creatorId,
      { $push: { courses: newCourse._id } }
    );

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

    Object.assign(course, updateData);
    await course.save();

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

    const mentorOfCourse = course.mentor;
    const menteesOfCourse = course.mentees;

    await Course.findByIdAndDelete(courseId);

    await Lesson.deleteMany({ course: courseId });
    await Review.deleteMany({ target: courseId, targetType: "Course" });

    if (mentorOfCourse) {
      await User.findByIdAndUpdate(
        mentorOfCourse,
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

// [GET] /api/reviews - Get all reviews
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'latest' } = req.query;
    
    let sortOptions = {};
    if (sortBy === 'latest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'highest-rating') {
      sortOptions = { rate: -1 };
    } else if (sortBy === 'lowest-rating') {
      sortOptions = { rate: 1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({})
      .populate('author', 'userName firstName lastName avatarUrl')
      .populate('target', 'title')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({});
    const totalPages = Math.ceil(totalReviews / limit);

    return responseHandler.ok(res, {
      reviews,
      totalReviews,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('getAllReviews error:', error);
    return responseHandler.error(res);
  }
};

export default {
  getAllCourses,
  getUserCourses,
  getCourseDetails,
  addCourseReview,
  getCourseReviews,
  getAllReviews,
  createCourse,
  updateCourse,
  deleteCourse,
  addMentorToCourse,
  removeMentorFromCourse,
  addContentToCourse,
  removeContentFromCourse,
};
