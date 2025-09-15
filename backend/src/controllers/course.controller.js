import path from "path";
import fs from "fs";

import responseHandler from "../handlers/response.handler.js";

import Course from "../models/course.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Lesson from "../models/lesson.model.js";
import Review from "../models/review.model.js";

import { uploadImage } from "../utils/cloudinary.js";
import {
  addMentorSchema,
  addContentSchema,
  addReviewSchema,
} from "../validations/course.validation.js";
//
const getParamId = (req) => req.params.courseId || req.params.id;
const isMentorOfCourse = (course, userId) =>
  course.mentor && course.mentor.toString() === userId.toString();

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

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (category) query.category = category;
    if (mentor) query.mentor = mentor;
    if (rate) query.rate = { $gte: Number(rate) };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (filterBy) {
      try {
        const filters = JSON.parse(filterBy);
        if (filters.category) query.category = filters.category;
        if (filters.priceMin || filters.priceMax) {
          query.price = {};
          if (filters.priceMin != null)
            query.price.$gte = Number(filters.priceMin);
          if (filters.priceMax != null)
            query.price.$lte = Number(filters.priceMax);
        }
        if (filters.level) query.level = filters.level;
        if (filters.language) query.language = filters.language;
      } catch (e) {
        console.error("Error parsing filterBy JSON:", e);
        return responseHandler.badRequest(res, "Invalid filterBy format.");
      }
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "newest") sortOptions = { createdAt: -1 };
    else if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else if (sortBy === "rating") sortOptions = { rate: -1, createdAt: -1 };
    else if (sortBy === "priceAsc") sortOptions = { price: 1, createdAt: -1 };
    else if (sortBy === "priceDesc") sortOptions = { price: -1, createdAt: -1 };

    const courses = await Course.find(query)
      .populate("mentor", "userName avatarUrl jobTitle")
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const total = await Course.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    const coursesWithId = courses.map((c) => {
      const obj = c.toObject();
      obj.courseId = obj._id;
      delete obj.__v;
      return obj;
    });

    return responseHandler.ok(res, {
      message: "Lấy danh sách khóa học thành công!",
      total,
      totalPages,
      currentPage: pageNum,
      skip,
      limit: limitNum,
      courses: coursesWithId,
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách khóa học:", err);
    responseHandler.error(res, err.message);
  }
};

export const getCourseById = async (req, res) => {
  try {
    const id = getParamId(req);
    const course = await Course.findById(id)
      .populate("mentor", "userName firstName lastName avatarUrl")
      .populate("mentees", "userName avatarUrl");

    if (!course)
      return responseHandler.notFound(res, "Khóa học không tồn tại!");

    // Get mentor profile data
    let mentorProfile = null;
    if (course.mentor) {
      mentorProfile = await Profile.findOne({ user: course.mentor._id });
    }

    const obj = course.toObject();
    obj.courseId = obj._id;

    // Merge mentor data with profile data
    if (obj.mentor && mentorProfile) {
      obj.mentor = {
        ...obj.mentor,
        jobTitle: mentorProfile.jobTitle,
        bio: mentorProfile.bio,
        location: mentorProfile.location,
        category: mentorProfile.category,
        experience: mentorProfile.experience,
        skills: mentorProfile.skills || [],
      };
    }

    delete obj.__v;
    return responseHandler.ok(res, {
      message: "Lấy thông tin khóa học thành công!",
      course: obj,
    });
  } catch (err) {
    console.error("Lỗi lấy khóa học:", err);
    responseHandler.error(res, err.message);
  }
};

export const getRelatedCourses = async (req, res) => {
  try {
    const { courseId, category, limit } = req.query;

    let categories = [];
    if (Array.isArray(category)) {
      categories = category.filter(Boolean);
    } else if (typeof category === "string") {
      categories = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }

    if ((!categories || categories.length === 0) && courseId) {
      const current = await Course.findById(courseId).select("category");
      if (current && Array.isArray(current.category))
        categories = current.category;
      else if (current && current.category) categories = [current.category];
    }

    const max = Math.min(parseInt(limit) || 6, 50);
    const filter = {
      ...(courseId ? { _id: { $ne: courseId } } : {}),
      ...(categories && categories.length > 0
        ? { category: { $in: categories } }
        : {}),
    };

    const courses = await Course.find(filter)
      .populate("mentor", "userName email avatarUrl")
      .sort({ rate: -1, createdAt: -1 })
      .limit(max);

    const coursesWithId = courses.map((c) => {
      const obj = c.toObject();
      obj.courseId = obj._id;
      delete obj.__v;
      return obj;
    });

    return responseHandler.ok(res, {
      message: "Lấy khoá học liên quan thành công!",
      total: coursesWithId.length,
      courses: coursesWithId,
    });
  } catch (err) {
    console.error("Lỗi lấy khoá học liên quan:", err);
    return responseHandler.error(res, err.message || "Đã xảy ra lỗi");
  }
};

export const getCoursesByMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const courses = await Course.find({ mentor: mentorId })
      .populate("mentor", "firstName lastName avatarUrl jobTitle")
      .limit(limit)
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

export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, sortBy, filterBy, page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user) return responseHandler.notFound(res, "User not found.");
    if (user.role !== "mentor") {
      return responseHandler.unauthorized(
        res,
        "Only mentors can access their courses."
      );
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query = { mentor: userId };
    if (search) query.title = { $regex: search, $options: "i" };

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else if (sortBy === "rating") sortOptions = { rate: -1 };
    else if (sortBy === "priceAsc") sortOptions = { price: 1 };
    else if (sortBy === "priceDesc") sortOptions = { price: -1 };

    if (filterBy) {
      try {
        const filters = JSON.parse(filterBy);
        if (filters.category) query.category = filters.category;
        if (filters.status) query.status = filters.status;
        if (filters.priceMin != null)
          query.price = {
            ...(query.price || {}),
            $gte: Number(filters.priceMin),
          };
        if (filters.priceMax != null)
          query.price = {
            ...(query.price || {}),
            $lte: Number(filters.priceMax),
          };
      } catch (e) {
        console.error("Error parsing filterBy JSON:", e);
        return responseHandler.badRequest(res, "Invalid filterBy format.");
      }
    }

    const courses = await Course.find(query)
      .populate("mentor", "userName avatar")
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limitNum);

    return responseHandler.ok(res, {
      courses,
      totalCourses,
      totalPages,
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error getting my courses:", err);
    responseHandler.error(res);
  }
};

export const createCourse = async (req, res) => {
  try {
    console.log("=== CREATE COURSE REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file ? "File uploaded" : "No file");

    const { id: userId } = req.user;
    let {
      title,
      description,
      courseOverview,
      keyLearningObjectives,
      price,
      category,
      tags,
      language,
      duration,
      link,
      driveLink,
      lectures,
      level,
    } = req.body;

    // Xử lý description - ưu tiên courseOverview
    const finalDescription = courseOverview || description || "";
    console.log("Final description:", finalDescription);

    // Xử lý link - ưu tiên driveLink
    const finalLink = driveLink || link || "";
    console.log("Final link:", finalLink);

    // Parse tags
    if (typeof tags === "string") {
      if (tags.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(tags);
          if (Array.isArray(parsed)) tags = parsed;
        } catch {
          tags = tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      } else {
        tags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }
    if (!Array.isArray(tags)) tags = [];

    // Parse language
    if (typeof language === "string") {
      if (language.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(language);
          if (Array.isArray(parsed)) language = parsed;
        } catch {
          language = language
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);
        }
      } else {
        language = language
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean);
      }
    }
    if (!Array.isArray(language)) language = [];

    const user = await User.findById(userId);
    if (!user || user.role !== "mentor") {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể tạo khóa học."
      );
    }

    // Upload thumbnail (nếu có)
    let thumbnailUrl = "";
    let thumbnailPublicId = "";
    if (req.file) {
      const base64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await uploadImage(base64, {
        public_id: `course_thumbnail_${userId}_${Date.now()}`,
        folder: "course_thumbnails",
        overwrite: true,
      });
      thumbnailUrl = result.secure_url;
      thumbnailPublicId = result.public_id;
    }

    console.log("Creating course with data:", {
      title,
      description: finalDescription,
      keyLearningObjectives,
      price: Number(price),
      mentor: userId,
      category,
      tags,
      language,
      duration: Number(duration) || 0,
      link: finalLink,
      lectures: Number(lectures),
      level,
      thumbnail: thumbnailUrl,
      thumbnailPublicId,
    });

    const newCourse = new Course({
      title,
      description: finalDescription,
      keyLearningObjectives,
      price: Number(price),
      mentor: userId,
      category,
      tags,
      language,
      duration: Number(duration) || 0,
      link: finalLink,
      lectures: Number(lectures),
      level,
      thumbnail: thumbnailUrl,
      thumbnailPublicId,
    });

    await newCourse.save();
    console.log("Course created successfully:", newCourse._id);

    const populatedCourse = await Course.findById(newCourse._id).populate(
      "mentor",
      "userName firstName lastName avatarUrl jobTitle"
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

export const handlePurchaseSuccess = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId)
      .populate("mentee")
      .populate("courses");
    if (!order)
      return responseHandler.notFound(res, "Không tìm thấy đơn hàng.");
    if (order.status !== "paid") {
      return responseHandler.badRequest(res, "Đơn hàng chưa được thanh toán.");
    }

    const user = await User.findById(order.mentee._id);
    if (!user) return responseHandler.notFound(res, "Không tìm thấy user.");

    for (const course of order.courses) {
      const existingPurchase = user.purchasedCourses?.find(
        (item) => item.course.toString() === course._id.toString()
      );
      if (!existingPurchase) {
        user.purchasedCourses = user.purchasedCourses || [];
        user.purchasedCourses.push({
          course: course._id,
          orderId,
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
      data: { orderId, coursesAdded: order.courses.length },
    });
  } catch (err) {
    console.error("Lỗi xử lý mua khóa học:", err);
    responseHandler.error(res, err.message);
  }
};

export const updateCourse = async (req, res) => {
  console.log("[updateCourse] req.body:", req.body);
  if (req.file) console.log("[updateCourse] req.file:", req.file);

  try {
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

    const courseId = getParamId(req);
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return responseHandler.notFound(res, "Course not found.");

    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to update this course."
      );
    }

    if (title !== undefined) course.title = title;
    if (price !== undefined) course.price = parseFloat(price);
    if (courseOverview !== undefined) course.description = courseOverview;
    if (keyLearningObjectives !== undefined)
      course.keyLearningObjectives = keyLearningObjectives;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (lectures !== undefined) course.lectures = parseInt(lectures);
    if (duration !== undefined) course.duration = parseInt(duration);
    if (driveLink !== undefined) course.link = driveLink;

    if (req.body.tags !== undefined) {
      let tags = req.body.tags;
      if (typeof tags === "string") {
        if (tags.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) tags = parsed;
          } catch {
            tags = tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
          }
        } else {
          tags = tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }
      if (!Array.isArray(tags)) tags = [];
      course.tags = tags;
    }

    if (req.body.language !== undefined) {
      let language = req.body.language;
      if (typeof language === "string") {
        if (language.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(language);
            if (Array.isArray(parsed)) language = parsed;
          } catch {
            language = language
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean);
          }
        } else {
          language = language
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);
        }
      }
      if (!Array.isArray(language)) language = [];
      course.language = language;
    }

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
    const courseId = getParamId(req);
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return responseHandler.notFound(res, "Course not found.");

    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to delete this course."
      );
    }

    const mentorOfCourse = course.mentor;
    const menteesOfCourse = course.mentees;

    // Xoá file thumbnail (local) nếu có
    if (course.thumbnail) {
      let thumbnailPath = course.thumbnail.replace(/\\/g, "/");
      if (!thumbnailPath.startsWith("uploads/")) {
        thumbnailPath = path.join("uploads", thumbnailPath);
      }
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

/* =============== Reviews =============== */
export const addCourseReview = async (req, res) => {
  try {
    const { error } = addReviewSchema.validate(req.body);
    if (error) return responseHandler.badRequest(res, error.details[0].message);

    const courseId = getParamId(req);
    const authorId = req.user.id;
    const { rating, comment } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return responseHandler.notFound(res, "Course not found.");

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
    const totalRatings = reviews.reduce((sum, r) => sum + r.rate, 0);
    course.rate = reviews.length ? totalRatings / reviews.length : 0;
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
    const courseId = getParamId(req);
    const reviews = await Review.find({
      target: courseId,
      targetType: "Course",
    }).populate("author", "userName firstName lastName avatar avatarUrl");

    console.log(`Found ${reviews.length} reviews for course ${courseId}`);
    return responseHandler.ok(res, reviews);
  } catch (err) {
    console.error("Error getting course reviews:", err);
    responseHandler.error(res);
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "latest" } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else if (sortBy === "highest-rating") sortOptions = { rate: -1 };
    else if (sortBy === "lowest-rating") sortOptions = { rate: 1 };

    const reviews = await Review.find({})
      .populate("author", "userName firstName lastName avatarUrl")
      .populate("target", "title")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments({});
    const totalPages = Math.ceil(totalReviews / limitNum);

    return responseHandler.ok(res, {
      reviews,
      totalReviews,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("getAllReviews error:", error);
    return responseHandler.error(res);
  }
};

export const addMentorToCourse = async (req, res) => {
  try {
    const { error } = addMentorSchema.validate(req.body);
    if (error) return responseHandler.badRequest(res, error.details[0].message);

    const courseId = getParamId(req);
    const userId = req.user.id;
    const { mentorId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return responseHandler.notFound(res, "Course not found.");

    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to add mentors to this course."
      );
    }

    const mentorToAdd = await User.findById(mentorId);
    if (!mentorToAdd || mentorToAdd.role !== "mentor") {
      return responseHandler.badRequest(
        res,
        "Invalid mentor ID or user is not a mentor."
      );
    }

    if (!Array.isArray(course.mentors)) course.mentors = [];
    if (course.mentors.find((m) => m.toString() === mentorId.toString())) {
      return responseHandler.badRequest(
        res,
        "Mentor is already assigned to this course."
      );
    }

    course.mentors.push(mentorId);
    await course.save();
    await User.findByIdAndUpdate(mentorId, {
      $addToSet: { courses: courseId },
    });

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
    const { courseId, mentorId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return responseHandler.notFound(res, "Course not found.");

    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to remove mentors from this course."
      );
    }

    if (!Array.isArray(course.mentors)) course.mentors = [];
    const before = course.mentors.length;
    course.mentors = course.mentors.filter(
      (m) => m.toString() !== mentorId.toString()
    );
    if (course.mentors.length === before) {
      return responseHandler.badRequest(
        res,
        "Mentor is not assigned to this course."
      );
    }

    await course.save();
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
    const { error } = addContentSchema.validate(req.body);
    if (error) return responseHandler.badRequest(res, error.details[0].message);

    const courseId = getParamId(req);
    const userId = req.user.id;
    const contentData = req.body;

    const course = await Course.findById(courseId);
    if (!course) return responseHandler.notFound(res, "Course not found.");

    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to add content to this course."
      );
    }

    const newLesson = new Lesson({ ...contentData, course: courseId });
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
    const { courseId, contentId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return responseHandler.notFound(res, "Course not found.");

    const user = await User.findById(userId);
    if (user.role !== "admin" && !isMentorOfCourse(course, userId)) {
      return responseHandler.forbidden(
        res,
        "You do not have permission to remove content from this course."
      );
    }

    const lesson = await Lesson.findOne({ _id: contentId, course: courseId });
    if (!lesson)
      return responseHandler.notFound(res, "Content not found in this course.");

    await Lesson.findByIdAndDelete(contentId);

    course.lessons = (course.lessons || []).filter(
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

export const getUserCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, search, sortBy, filterBy, page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user) return responseHandler.notFound(res, "User not found.");

    let query = {};
    if (role === "mentee") query = { mentees: userId };
    else if (role === "mentor") query = { mentor: userId };
    else return responseHandler.badRequest(res, "Invalid role specified.");

    if (search) query.title = { $regex: search, $options: "i" };

    let sortOptions = {};
    if (sortBy === "newest") sortOptions = { createdAt: -1 };
    else if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else if (sortBy === "rating") sortOptions = { rate: -1 };
    else if (sortBy === "priceAsc") sortOptions = { price: 1 };
    else if (sortBy === "priceDesc") sortOptions = { price: -1 };

    if (filterBy) {
      try {
        const filters = JSON.parse(filterBy);
        if (filters.category) query.category = filters.category;
        if (filters.priceMin != null)
          query.price = {
            ...(query.price || {}),
            $gte: Number(filters.priceMin),
          };
        if (filters.priceMax != null)
          query.price = {
            ...(query.price || {}),
            $lte: Number(filters.priceMax),
          };
      } catch (e) {
        console.error("Error parsing filterBy JSON:", e);
        return responseHandler.badRequest(res, "Invalid filterBy format.");
      }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const courses = await Course.find(query)
      .populate("mentor", "userName avatar")
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limitNum);

    return responseHandler.ok(res, {
      courses,
      totalCourses,
      totalPages,
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error getting user courses:", err);
    responseHandler.error(res);
  }
};

export const checkCoursePurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      return responseHandler.badRequest(res, "Course ID is required.");
    }

    // Tìm course và kiểm tra xem user có trong mảng mentees không
    const course = await Course.findById(courseId);

    if (!course) {
      return responseHandler.notFound(res, "Khóa học không tồn tại!");
    }

    const isPurchased = course.mentees.includes(userId);

    return responseHandler.ok(res, {
      message: isPurchased
        ? "Bạn đã mua khóa học này."
        : "Bạn chưa mua khóa học này.",
      isPurchased,
      courseId,
      courseTitle: course.title,
    });
  } catch (err) {
    console.error("Error checking course purchase status:", err);
    responseHandler.error(res, err.message);
  }
};

export default {
  getCourses,
  getCourseById,
  getRelatedCourses,
  getCoursesByMentor,
  getMyCourses,
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
  handlePurchaseSuccess,
  getUserCourses,
  checkCoursePurchaseStatus,
};
