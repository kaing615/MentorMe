import responseHandler from "../handlers/response.handler.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";

/**
 * @desc Lấy danh sách khóa học đã mua của user
 * @route GET /api/purchased-courses
 * @access Private
 */
const getPurchasedCourses = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    console.log("Getting purchased courses for user:", userId);

    // Lấy danh sách courses mà user là mentee
    const purchasedCourses = await Course.find({
      mentees: userId,
    })
      .populate({
        path: "mentor",
        select: "firstName lastName avatarUrl jobTitle userName email",
      })
      .sort({ createdAt: -1 });

    console.log("Found purchased courses:", purchasedCourses.length);

    // Format response
    const formattedCourses = purchasedCourses.map((course) => ({
      courseId: course._id,
      courseInfo: {
        _id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
        mentor: course.mentor,
        category: course.category,
        duration: course.duration,
        rate: course.rate,
        link: course.link,
        lectures: course.lectures,
        thumbnail: course.thumbnail,
      },
      purchaseDate: course.createdAt, // Use course creation date as fallback
      progress: 0, // Default progress
      lastAccessDate: null,
      isCompleted: false,
      orderInfo: {
        // We could populate order info later if needed
        transactionId: null,
        paymentMethod: null,
        createdAt: course.createdAt,
        orderNumber: null,
      },
    }));

    return responseHandler.ok(res, {
      message: "Lấy danh sách khóa học đã mua thành công.",
      totalCourses: formattedCourses.length,
      courses: formattedCourses,
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học đã mua:", err);
    return responseHandler.error(res, "Lỗi server khi lấy khóa học đã mua.");
  }
};

/**
 * @desc Cập nhật tiến độ học khóa học
 * @route PUT /api/purchased-courses/:courseId/progress
 * @access Private
 */
const updateCourseProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;
    const { progress } = req.body;

    if (progress < 0 || progress > 100) {
      return responseHandler.badRequest(res, "Tiến độ phải từ 0 đến 100%.");
    }

    // Tìm purchased course từ PurchasedCourse model
    const purchasedCourse = await PurchasedCourse.findOne({
      user: userId,
      course: courseId,
    });

    if (!purchasedCourse) {
      return responseHandler.badRequest(res, "Bạn chưa mua khóa học này.");
    }

    // Cập nhật tiến độ
    purchasedCourse.progress = progress;
    purchasedCourse.lastAccessDate = new Date();
    purchasedCourse.isCompleted = progress === 100;

    await purchasedCourse.save();

    return responseHandler.ok(res, {
      message: "Cập nhật tiến độ học thành công.",
      data: {
        courseId,
        progress,
        isCompleted: progress === 100,
        lastAccessDate: purchasedCourse.lastAccessDate,
      },
    });
  } catch (err) {
    console.error("Lỗi cập nhật tiến độ học:", err);
    responseHandler.error(res);
  }
};

/**
 * @desc Kiểm tra xem user đã mua khóa học này chưa
 * @route GET /api/purchased-courses/check/:courseId
 * @access Private
 */
const checkCoursePurchase = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    // Kiểm tra từ PurchasedCourse model
    const purchasedCourse = await PurchasedCourse.findOne({
      user: userId,
      course: courseId,
    }).populate({
      path: "course",
      select: "title description price thumbnail",
    });

    if (!purchasedCourse) {
      return responseHandler.ok(res, {
        message: "Bạn chưa mua khóa học này.",
        isPurchased: false,
        courseData: null,
      });
    }

    return responseHandler.ok(res, {
      message: "Bạn đã mua khóa học này.",
      isPurchased: true,
      courseData: {
        courseId: purchasedCourse.course._id,
        courseInfo: purchasedCourse.course,
        progress: purchasedCourse.progress,
        isCompleted: purchasedCourse.isCompleted,
        purchaseDate: purchasedCourse.purchaseDate,
        lastAccessDate: purchasedCourse.lastAccessDate,
      },
    });
  } catch (err) {
    console.error("Lỗi kiểm tra mua khóa học:", err);
    responseHandler.error(res);
  }
};

/**
 * @desc Xử lý khi thanh toán thành công - tự động thêm courses từ order
 * @route POST /api/purchased-courses/purchase-success
 * @access Private
 */
const handlePurchaseSuccess = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.body;

    if (!orderId) {
      return responseHandler.badRequest(res, "OrderId is required.");
    }

    // Tìm order và populate courses
    const order = await Order.findById(orderId)
      .populate("mentee")
      .populate("courses");

    console.log("Found order:", order ? "Yes" : "No");
    console.log("Order ID:", orderId);
    if (order) {
      console.log(
        "Order items:",
        order.items ? order.items.length : "undefined"
      );
      console.log(
        "Order courses:",
        order.courses ? order.courses.length : "undefined"
      );
    }

    if (!order) {
      return responseHandler.notFound(res, "Không tìm thấy đơn hàng.");
    }

    // Kiểm tra order có thuộc về user này không
    if (order.mentee._id.toString() !== userId.toString()) {
      return responseHandler.forbidden(res, "Đơn hàng không thuộc về bạn.");
    }

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notFound(res, "Không tìm thấy user.");
    }

    let coursesAdded = 0;

    // Lấy danh sách courses từ order - có thể ở items hoặc courses
    let coursesToAdd = [];

    if (order.items && order.items.length > 0) {
      // Nếu có items, lấy courseId từ items
      coursesToAdd = order.items.map((item) => item.courseId);
    } else if (order.courses && order.courses.length > 0) {
      // Nếu có courses array
      coursesToAdd = order.courses;
    } else {
      return responseHandler.badRequest(res, "Đơn hàng không có khóa học nào.");
    }

    // Thêm từng khóa học vào danh sách đã mua
    for (const courseId of coursesToAdd) {
      try {
        // Kiểm tra xem đã mua chưa
        const existingPurchase = await PurchasedCourse.findOne({
          user: userId,
          course: courseId,
        });

        if (!existingPurchase) {
          // Tạo record purchased course mới
          await PurchasedCourse.create({
            user: userId,
            course: courseId,
            order: orderId,
            purchaseDate: new Date(),
            progress: 0,
            lastAccessDate: new Date(),
            isCompleted: false,
          });
          coursesAdded++;
        }
      } catch (error) {
        console.error(`Error adding course ${courseId}:`, error);
      }
    }

    return responseHandler.ok(res, {
      message: `Đã thêm ${coursesAdded} khóa học vào danh sách đã mua.`,
      coursesAdded,
      totalCourses: coursesToAdd.length,
    });
  } catch (err) {
    console.error("Lỗi xử lý mua khóa học:", err);
    return responseHandler.error(res);
  }
};

/**
 * @desc Lấy thống kê học tập của user
 * @route GET /api/purchased-courses/stats
 * @access Private
 */
const getLearningStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy tất cả purchased courses từ PurchasedCourse model
    const purchasedCourses = await PurchasedCourse.find({ user: userId });

    const totalCourses = purchasedCourses.length;
    const completedCourses = purchasedCourses.filter(
      (course) => course.isCompleted
    ).length;
    const inProgressCourses = purchasedCourses.filter(
      (course) => course.progress > 0 && !course.isCompleted
    ).length;
    const notStartedCourses = purchasedCourses.filter(
      (course) => course.progress === 0
    ).length;

    const averageProgress =
      totalCourses > 0
        ? purchasedCourses.reduce((sum, course) => sum + course.progress, 0) /
          totalCourses
        : 0;

    return responseHandler.ok(res, {
      message: "Lấy thống kê học tập thành công.",
      data: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        notStartedCourses,
        averageProgress: Math.round(averageProgress * 100) / 100,
        completionRate:
          totalCourses > 0
            ? Math.round((completedCourses / totalCourses) * 100)
            : 0,
      },
    });
  } catch (err) {
    console.error("Lỗi lấy thống kê học tập:", err);
    responseHandler.error(res);
  }
};

export default {
  getPurchasedCourses,
  updateCourseProgress,
  checkCoursePurchase,
  handlePurchaseSuccess,
  getLearningStats,
};
