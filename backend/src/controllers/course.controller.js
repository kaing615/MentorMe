import responseHandler from "../handlers/response.handler.js";
import Course from "../models/course.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

/**
 * @desc Lấy tất cả khóa học
 * @route GET /api/course
 * @access Public
 */
export const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, mentor, search, rate } = req.query;

    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by mentor
    if (mentor) {
      query.mentor = mentor;
    }

    // Filter by rate
    if (rate) {
      query.rate = { $gte: Number(rate) };
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const courses = await Course.find(query)
      .populate("mentor", "firstName lastName avatarUrl jobTitle")
      .limit(limit * 1)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    const coursesWithId = courses.map((course) => {
      const obj = course.toObject();
      obj.courseId = obj._id;
      delete obj._id;
      delete obj.__v;
      return obj;
    });

    return responseHandler.ok(res, {
      message: "Lấy danh sách khóa học thành công!",
      total,
      skip,
      limit,
      courses: coursesWithId,
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
      .populate("mentor", "firstName lastName avatarUrl jobTitle bio location")
      .populate("mentees", "firstName lastName avatarUrl");

    if (!course) {
      return responseHandler.notfound(res, "Khóa học không tồn tại!");
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

    // Kiểm tra user có phải mentor không
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

    // Tìm order và populate courses
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

    // Thêm từng khóa học vào danh sách đã mua
    for (const course of order.courses) {
      // Kiểm tra xem đã mua chưa
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

        // Thêm user vào danh sách mentees của course
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

export default {
  getCourses,
  getCourseById,
  createCourse,
  getCoursesByMentor,
};
