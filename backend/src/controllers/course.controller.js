import responseHandler from "../handlers/response.handler.js";
import Course from "../models/course.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Lesson from "../models/lesson.model.js";
import Review from "../models/review.model.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import {
  createCourseSchema,
  updateCourseSchema,
  addMentorSchema,
  addContentSchema,
  addReviewSchema,
} from "../validation/course.validation.js";

// Helper
const isMentorOfCourse = (course, userId) => {
  return course.mentor && course.mentor.toString() === userId.toString();
};

/**
 * @desc Lấy tất cả khóa học
 * @route GET /api/course
 * @access Public
 */
export const getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      mentor,
      search,
      rate,
      sortBy,
      filterBy,
    } = req.query;
    let query = {};
    if (category) query.category = category;
    if (mentor) query.mentor = mentor;
    if (rate) query.rate = { $gte: Number(rate) };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    // Thêm filterBy (JSON)
    if (filterBy) {
      try {
        const filters = JSON.parse(filterBy);
        if (filters.category) query.category = filters.category;
        if (filters.priceMin || filters.priceMax) {
          query.price = {};
          if (filters.priceMin) query.price.$gte = filters.priceMin;
          if (filters.priceMax) query.price.$lte = filters.priceMax;
        }
      } catch (parseError) {
        console.error("Error parsing filterBy JSON:", parseError);
        return responseHandler.badRequest(res, "Invalid filterBy format.");
      }
    }
    // Sort
    let sortOptions = {};
    if (sortBy === "newest") sortOptions = { createdAt: -1 };
    else if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else if (sortBy === "rating") sortOptions = { rate: -1 };
    else if (sortBy === "priceAsc") sortOptions = { price: 1 };
    else if (sortBy === "priceDesc") sortOptions = { price: -1 };
    else sortOptions = { createdAt: -1 };

    const skip = (page - 1) * limit;
    const courses = await Course.find(query)
      .populate("mentor", "userName avatarUrl jobTitle")
      .limit(Number(limit))
      .skip(skip)
      .sort(sortOptions);
    const total = await Course.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return responseHandler.ok(res, {
      message: "Lấy danh sách khóa học thành công!",
      total,
      totalPages,
      currentPage: parseInt(page),
      skip,
      limit: Number(limit),
      courses,
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách khóa học:", err);
    responseHandler.error(res, err.message);
  }
};

/**
 * @desc Lấy chi tiết khóa học
 * @route GET /api/course/:id
 * @access Public
 */
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("mentor", "userName avatarUrl jobTitle bio location")
      .populate("mentees", "userName avatarUrl")
      .populate("lessons");
    if (!course) {
      return responseHandler.notFound(res, "Khóa học không tồn tại!");
    }
    return responseHandler.ok(res, {
      message: "Lấy thông tin khóa học thành công!",
      course,
    });
  } catch (err) {
    console.error("Lỗi lấy khóa học:", err);
    responseHandler.error(res, err.message);
  }
};

/**
 * @desc Tạo khóa học mới (chỉ mentor)
 * @route POST /api/course
 * @access Private (Mentor only)
 */
export const createCourse = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      title,
      description,
      price,
      category,
      tags,
      duration,
      link,
      lectures,
    } = req.body;
    const user = await User.findById(userId);
    if (!user || user.role !== "mentor") {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể tạo khóa học."
      );
    }
    const newCourse = new Course({
      title,
      description,
      price,
      mentor: userId,
      category,
      tags: tags || [],
      duration,
      link,
      lectures,
    });
    await newCourse.save();
    const populatedCourse = await Course.findById(newCourse._id).populate(
      "mentor",
      "firstName lastName avatarUrl jobTitle"
    );
    return responseHandler.created(res, {
      message: "Tạo khóa học thành công.",
      data: populatedCourse,
    });
  } catch (err) {
    console.error("Lỗi tạo khóa học:", err);
    responseHandler.error(res, err.message);
  }
};

/**
 * @desc Xử lý khi user mua khóa học thành công
 * @route POST /api/course/purchase-success
 * @access Private
 */
export const handlePurchaseSuccess = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId)
      .populate("mentee")
      .populate("courses");
    if (!order) {
      return responseHandler.notfound(res, "Không tìm thấy đơn hàng.");
    }
    if (order.status !== "paid") {
      return responseHandler.badrequest(res, "Đơn hàng chưa được thanh toán.");
    }
    const user = await User.findById(order.mentee._id);
    if (!user) {
      return responseHandler.notfound(res, "Không tìm thấy user.");
    }
    for (const course of order.courses) {
      const existingPurchase = user.purchasedCourses.find(
        (item) => item.course.toString() === course._id.toString()
      );
      if (!existingPurchase) {
        user.purchasedCourses.push({
          course: course._id,
          orderId: orderId,
          purchaseDate: new Date(),
          progress: 0,
          lastAccessDate: new Date(),
          isCompleted: false,
        });
        if (!course.mentees.includes(user._id)) {
          course.mentees.push(user._id);
          await course.save();
        }
      }
    }
    await user.save();
    return responseHandler.ok(res, {
      message: "Xử lý mua khóa học thành công.",
      data: {
        orderId,
        coursesAdded: order.courses.length,
      },
    });
  } catch (err) {
    console.error("Lỗi xử lý mua khóa học:", err);
    responseHandler.error(res, err.message);
  }
};

/**
 * @desc Lấy khóa học theo mentor
 * @route GET /api/course/mentor/:mentorId
 * @access Public
 */
export const getCoursesByMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const courses = await Course.find({ mentor: mentorId })
      .populate("mentor", "firstName lastName avatarUrl jobTitle")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Course.countDocuments({ mentor: mentorId });
    return responseHandler.ok(res, {
      message: "Lấy khóa học theo mentor thành công.",
      data: {
        courses,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (err) {
    console.error("Lỗi lấy khóa học theo mentor:", err);
    responseHandler.error(res, err.message);
  }
};

export const getUserCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, search, sortBy, filterBy, page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notFound(res, "User not found.");
    }

    let query = {};

    if (role === "mentee") {
      query = { mentees: userId };
    } else if (role === "mentor") {
      query = { mentor: userId }; // Fix: use singular mentor field
    } else {
      return responseHandler.badRequest(res, "Invalid role specified.");
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    let sortOptions = {};
    if (sortBy === "newest") {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === "rating") {
      sortOptions = { rate: -1 };
    } else if (sortBy === "priceAsc") {
      sortOptions = { price: 1 };
    } else if (sortBy === "priceDesc") {
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
      .populate("mentor", "userName avatar")
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
export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, sortBy, filterBy, page = 1, limit = 10 } = req.query;

    // Verify user exists and is a mentor
    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notFound(res, "User not found.");
    }

    if (user.role !== "mentor") {
      return responseHandler.unauthorized(
        res,
        "Only mentors can access their courses."
      );
    }

    let query = { mentor: userId };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    let sortOptions = {};
    if (sortBy === "newest") {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === "rating") {
      sortOptions = { rate: -1 };
    } else if (sortBy === "priceAsc") {
      sortOptions = { price: 1 };
    } else if (sortBy === "priceDesc") {
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
      .populate("mentor", "userName avatar")
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
// Đã hợp nhất logic getCourseDetails vào getCourseById, không cần hàm này nữa
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
      return responseHandler.forbidden(
        res,
        "You can only review courses you are enrolled in."
      );
    }

    const existingReview = await Review.findOne({
      author: authorId,
      target: courseId,
      targetType: "Course",
    });
    if (existingReview) {
      return responseHandler.badRequest(
        res,
        "You have already reviewed this course."
      );
    }

    const newReview = new Review({
      author: authorId,
      targetType: "Course",
      target: courseId,
      content: comment,
      rate: rating,
    });

    await newReview.save();

    const reviews = await Review.find({
      target: courseId,
      targetType: "Course",
    });
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
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({
      target: courseId,
      targetType: "Course",
    }).populate("author", "userName avatar");

    return responseHandler.ok(res, reviews);
  } catch (err) {
    console.error("Error getting course reviews:", err);
    responseHandler.error(res);
  }
};
export const updateCourse = async (req, res) => {
  try {
    // Map các trường FE gửi về sang đúng trường BE
    const {
      title,
      price,
      courseOverview,
      keyLearningObjectives,
      category,
      level,
      lectures,
      duration,
      driveLink,
    } = req.body;

    // Validate dữ liệu đầu vào (cho phép optional)
    // Không validate bằng Joi vì FE gửi field khác, tự validate đơn giản

    const { courseId } = req.params;
    const userId = req.user.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }
    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to update this course."
      );
    }

    // Map lại các trường
    if (title !== undefined) course.title = title;
    if (price !== undefined) course.price = parseFloat(price);
    if (courseOverview !== undefined) course.description = courseOverview;
    if (keyLearningObjectives !== undefined)
      course.shortDescription = keyLearningObjectives;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (lectures !== undefined) course.lectures = parseInt(lectures);
    if (duration !== undefined) course.duration = parseInt(duration);
    if (driveLink !== undefined) course.link = driveLink;
    // Nếu có file mới thì cập nhật thumbnail
    if (req.file && req.file.path) {
      course.thumbnail = req.file.path;
    }

    await course.save();
    return responseHandler.ok(res, course);
  } catch (err) {
    console.error("Error updating course:", err);
    responseHandler.error(res);
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Course not found.");
    }

    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to delete this course."
      );
    }

    const mentorOfCourse = course.mentor;
    const menteesOfCourse = course.mentees;

    // Xoá file thumbnail nếu có
    if (course.thumbnail) {
      let thumbnailPath = course.thumbnail;
      // Normalize path separators for cross-platform
      thumbnailPath = thumbnailPath.replace(/\\/g, "/");
      // Nếu có tiền tố uploads/ thì giữ nguyên, nếu không thì thêm vào
      if (!thumbnailPath.startsWith("uploads/")) {
        thumbnailPath = path.join("uploads", thumbnailPath);
      }
      // Đảm bảo dùng path.resolve để lấy đúng đường dẫn tuyệt đối
      const fullPath = path.resolve(process.cwd(), thumbnailPath);
      fs.unlink(fullPath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Error deleting thumbnail:", err, fullPath);
        }
      });
    }

    await Course.findByIdAndDelete(courseId);
    await Lesson.deleteMany({ course: courseId });
    await Review.deleteMany({ target: courseId, targetType: "Course" });

    if (mentorOfCourse) {
      await User.findByIdAndUpdate(mentorOfCourse, {
        $pull: { courses: courseId },
      });
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
    responseHandler.error(res, err);
  }
};
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
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to add mentors to this course."
      );
    }

    const mentorToAdd = await User.findById(mentorId);
    if (!mentorToAdd || !mentorToAdd.roles.includes("mentor")) {
      return responseHandler.badRequest(
        res,
        "Invalid mentor ID or user is not a mentor."
      );
    }

    if (course.mentors.includes(mentorId)) {
      return responseHandler.badRequest(
        res,
        "Mentor is already assigned to this course."
      );
    }

    course.mentors.push(mentorId);
    await course.save();

    // Thêm ID khóa học vào model User của mentor mới
    await User.findByIdAndUpdate(mentorId, { $push: { courses: courseId } });

    const updatedCourse = await Course.findById(courseId).populate(
      "mentors",
      "userName avatar"
    );

    return responseHandler.ok(res, updatedCourse);
  } catch (err) {
    console.error("Error adding mentor to course:", err);
    responseHandler.error(res);
  }
};
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
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to remove mentors from this course."
      );
    }

    const mentorIndex = course.mentors.indexOf(mentorId);
    if (mentorIndex === -1) {
      return responseHandler.badRequest(
        res,
        "Mentor is not assigned to this course."
      );
    }

    course.mentors.splice(mentorIndex, 1);
    await course.save();

    // Xóa ID khóa học khỏi model User của mentor bị xóa
    await User.findByIdAndUpdate(mentorId, { $pull: { courses: courseId } });

    const updatedCourse = await Course.findById(courseId).populate(
      "mentors",
      "userName avatar"
    );

    return responseHandler.ok(res, updatedCourse);
  } catch (err) {
    console.error("Error removing mentor from course:", err);
    responseHandler.error(res);
  }
};
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
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to add content to this course."
      );
    }

    const newLesson = new Lesson({
      ...contentData,
      course: courseId,
    });

    await newLesson.save();

    course.lessons.push(newLesson._id);
    await course.save();

    const updatedCourse = await Course.findById(courseId).populate("lessons");

    return responseHandler.created(res, updatedCourse);
  } catch (err) {
    console.error("Error adding content to course:", err);
    responseHandler.error(res);
  }
};
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
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to remove content from this course."
      );
    }

    const lesson = await Lesson.findOne({ _id: contentId, course: courseId });
    if (!lesson) {
      return responseHandler.notFound(res, "Content not found in this course.");
    }

    await Lesson.findByIdAndDelete(contentId);

    course.lessons = course.lessons.filter(
      (lessonId) => lessonId.toString() !== contentId.toString()
    );
    await course.save();

    const updatedCourse = await Course.findById(courseId).populate("lessons");

    return responseHandler.ok(res, updatedCourse);
  } catch (err) {
    console.error("Error removing content from course:", err);
    responseHandler.error(res);
  }
};
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "latest" } = req.query;

    let sortOptions = {};
    if (sortBy === "latest") {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === "highest-rating") {
      sortOptions = { rate: -1 };
    } else if (sortBy === "lowest-rating") {
      sortOptions = { rate: 1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find({})
      .populate("author", "userName firstName lastName avatarUrl")
      .populate("target", "title")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({});
    const totalPages = Math.ceil(totalReviews / limit);

    return responseHandler.ok(res, {
      reviews,
      totalReviews,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("getAllReviews error:", error);
    return responseHandler.error(res);
  }
};

// Export default object
export default {
  getCourses,
  getCourseById,
  createCourse,
  getCoursesByMentor,
  handlePurchaseSuccess,
  getUserCourses,
  getMyCourses,
  addCourseReview,
  getCourseReviews,
  updateCourse,
  deleteCourse,
  addMentorToCourse,
  removeMentorFromCourse,
  addContentToCourse,
  removeContentFromCourse,
  getAllReviews,
};
