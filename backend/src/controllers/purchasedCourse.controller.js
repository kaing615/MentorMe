import responseHandler from "../handlers/response.handler.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

/**
 * @desc Lấy danh sách khóa học đã mua của user
 * @route GET /api/purchased-courses
 * @access Private
 */
const getPurchasedCourses = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const user = await User.findById(userId)
      .populate({
        path: "purchasedCourses.course",
        select:
          "title description price mentor category duration rate link lectures",
        populate: {
          path: "mentor",
          select: "firstName lastName avatarUrl jobTitle",
        },
      })
      .populate(
        "purchasedCourses.orderId",
        "transactionId paymentMethod createdAt"
      );

    if (!user) {
      return responseHandler.notfound(res, "Không tìm thấy user.");
    }

    const purchasedCourses = user.purchasedCourses.map((item) => ({
      courseId: item.course._id,
      courseInfo: item.course,
      purchaseDate: item.purchaseDate,
      progress: item.progress,
      lastAccessDate: item.lastAccessDate,
      isCompleted: item.isCompleted,
      orderInfo: item.orderId,
    }));

    return responseHandler.ok(res, {
      message: "Lấy danh sách khóa học đã mua thành công.",
      data: {
        totalCourses: purchasedCourses.length,
        courses: purchasedCourses,
      },
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách khóa học đã mua:", err);
    responseHandler.error(res);
  }
};

/**
 * @desc Cập nhật tiến độ học khóa học
 * @route PUT /api/purchased-courses/:courseId/progress
 * @access Private
 */
const updateCourseProgress = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { courseId } = req.params;
    const { progress } = req.body;

    if (progress < 0 || progress > 100) {
      return responseHandler.badrequest(res, "Tiến độ phải từ 0 đến 100%.");
    }

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notfound(res, "Không tìm thấy user.");
    }

    const courseIndex = user.purchasedCourses.findIndex(
      (item) => item.course.toString() === courseId
    );

    if (courseIndex === -1) {
      return responseHandler.badrequest(res, "Bạn chưa mua khóa học này.");
    }

    user.purchasedCourses[courseIndex].progress = progress;
    user.purchasedCourses[courseIndex].lastAccessDate = new Date();
    user.purchasedCourses[courseIndex].isCompleted = progress === 100;

    await user.save();

    return responseHandler.ok(res, {
      message: "Cập nhật tiến độ học thành công.",
      data: {
        courseId,
        progress,
        isCompleted: progress === 100,
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
    const { id: userId } = req.user;
    const { courseId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notfound(res, "Không tìm thấy user.");
    }

    const purchasedCourse = user.purchasedCourses.find(
      (item) => item.course.toString() === courseId
    );

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
      courseData: purchasedCourse,
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
    const { id: userId } = req.user;
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

    // Kiểm tra order có thuộc về user này không
    if (order.mentee._id.toString() !== userId) {
      return responseHandler.forbidden(res, "Đơn hàng không thuộc về bạn.");
    }

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notfound(res, "Không tìm thấy user.");
    }

    let coursesAdded = 0;

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
        if (!course.mentees.includes(userId)) {
          course.mentees.push(userId);
          await course.save();
        }

        coursesAdded++;
      }
    }

    await user.save();

    return responseHandler.ok(res, {
      message: "Xử lý mua khóa học thành công.",
      data: {
        orderId,
        coursesAdded,
        totalCourses: order.courses.length,
      },
    });
  } catch (err) {
    console.error("Lỗi xử lý mua khóa học:", err);
    responseHandler.error(res);
  }
};

/**
 * @desc Lấy thống kê học tập của user
 * @route GET /api/purchased-courses/stats
 * @access Private
 */
const getLearningStats = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notfound(res, "Không tìm thấy user.");
    }

    const totalCourses = user.purchasedCourses.length;
    const completedCourses = user.purchasedCourses.filter(
      (course) => course.isCompleted
    ).length;
    const inProgressCourses = user.purchasedCourses.filter(
      (course) => course.progress > 0 && !course.isCompleted
    ).length;
    const notStartedCourses = user.purchasedCourses.filter(
      (course) => course.progress === 0
    ).length;

    const averageProgress =
      totalCourses > 0
        ? user.purchasedCourses.reduce(
            (sum, course) => sum + course.progress,
            0
          ) / totalCourses
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
