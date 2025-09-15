import responseHandler from "../handlers/response.handler.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import PurchasedCourse from "../models/purchasedCourse.model.js";

/**
 * @desc Lấy danh sách khóa học đã mua của user
 * @route GET /api/purchased-courses
 * @access Private
 */
const getPurchasedCourses = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    console.log("Getting purchased courses for user:", userId);

    // Lấy purchased courses từ PurchasedCourse model (NEW)
    const purchasedCourses = await PurchasedCourse.find({
      mentee: userId,
    })
      .populate({
        path: "course",
        select:
          "title description price category duration rate link lectures thumbnail mentor",
        populate: {
          path: "mentor",
          select: "firstName lastName avatarUrl jobTitle userName email",
        },
      })
      .populate({
        path: "order",
        select: "orderNumber totalAmount paymentMethod createdAt",
      })
      .sort({ purchaseDate: -1 });

    console.log("Found PurchasedCourse records:", purchasedCourses.length);

    // Format purchased courses với purchasedCourseId
    const formattedPurchasedCourses = purchasedCourses.map(
      (purchasedCourse) => ({
        purchasedCourseId: purchasedCourse._id, // ⭐ ID của purchased course (NEW way)
        courseId: purchasedCourse.course._id, // ID của course gốc
        courseInfo: {
          _id: purchasedCourse.course._id,
          title: purchasedCourse.course.title,
          description: purchasedCourse.course.description,
          price: purchasedCourse.price, // Giá lúc mua
          mentor: purchasedCourse.course.mentor,
          category: purchasedCourse.course.category,
          duration: purchasedCourse.course.duration,
          rate: purchasedCourse.course.rate,
          link: purchasedCourse.course.link,
          lectures: purchasedCourse.course.lectures,
          thumbnail: purchasedCourse.course.thumbnail,
        },
        purchaseDate: purchasedCourse.purchaseDate,
        lastAccessDate: purchasedCourse.lastAccessDate,
        rating: purchasedCourse.rating,
        review: purchasedCourse.review,
        orderInfo: {
          orderNumber: purchasedCourse.order?.orderNumber,
          totalAmount: purchasedCourse.order?.totalAmount,
          paymentMethod: purchasedCourse.order?.paymentMethod,
          createdAt: purchasedCourse.order?.createdAt,
        },
        hasRealPurchasedRecord: true, // Flag để biết đây là purchased course thật
      })
    );

    // Lấy courses từ Course.mentees array (LEGACY support)
    const legacyCourses = await Course.find({
      mentees: userId,
    })
      .populate({
        path: "mentor",
        select: "firstName lastName avatarUrl jobTitle userName email",
      })
      .sort({ createdAt: -1 });

    console.log("Found legacy Course.mentees records:", legacyCourses.length);

    // Lọc out những courses đã có trong PurchasedCourse để tránh duplicate
    const existingCourseIds = new Set(
      purchasedCourses.map((pc) => pc.course._id.toString())
    );
    const uniqueLegacyCourses = legacyCourses.filter(
      (course) => !existingCourseIds.has(course._id.toString())
    );

    console.log(
      "Unique legacy courses (not in PurchasedCourse):",
      uniqueLegacyCourses.length
    );

    // Format legacy courses KHÔNG có purchasedCourseId
    const formattedLegacyCourses = uniqueLegacyCourses.map((course) => ({
      purchasedCourseId: null, // ⭐ KHÔNG có purchasedCourseId cho legacy
      courseId: course._id, // Chỉ có courseId
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
      lastAccessDate: null,
      rating: null,
      review: null,
      orderInfo: {
        orderNumber: null,
        totalAmount: null,
        paymentMethod: null,
        createdAt: course.createdAt,
      },
      hasRealPurchasedRecord: false, // Flag để biết đây là legacy
    }));

    // Combine cả hai loại
    const allCourses = [
      ...formattedPurchasedCourses,
      ...formattedLegacyCourses,
    ];

    return responseHandler.ok(res, {
      message: "Lấy danh sách khóa học đã mua thành công.",
      totalCourses: allCourses.length,
      purchasedCoursesCount: formattedPurchasedCourses.length, // Courses với purchasedCourseId
      legacyCoursesCount: formattedLegacyCourses.length, // Legacy courses chỉ có courseId
      courses: allCourses,
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học đã mua:", err);
    return responseHandler.error(res, "Lỗi server khi lấy khóa học đã mua.");
  }
};

/**
 * @desc Lấy chi tiết purchased course theo purchasedCourseId
 * @route GET /api/purchased-courses/details/:purchasedCourseId
 * @access Private
 */
const getPurchasedCourseById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { purchasedCourseId } = req.params;

    // Lấy purchased course theo ID và kiểm tra ownership
    const purchasedCourse = await PurchasedCourse.findOne({
      _id: purchasedCourseId,
      mentee: userId, // Đảm bảo chỉ user sở hữu mới access được
    })
      .populate({
        path: "course",
        select:
          "title description price thumbnail category duration rate lectures link mentor",
        populate: {
          path: "mentor",
          select:
            "firstName lastName userName avatarUrl jobTitle bio email skills experience category",
        },
      })
      .populate({
        path: "order",
        select: "orderNumber purchaseDate totalAmount paymentMethod",
      });

    if (!purchasedCourse) {
      return responseHandler.notFound(
        res,
        "Không tìm thấy khóa học đã mua hoặc bạn không có quyền truy cập."
      );
    }

    // Update last access date
    purchasedCourse.lastAccessDate = new Date();
    await purchasedCourse.save();

    return responseHandler.ok(res, {
      message: "Lấy chi tiết khóa học đã mua thành công.",
      data: {
        purchasedCourseId: purchasedCourse._id,
        courseId: purchasedCourse.course._id,
        courseInfo: purchasedCourse.course,
        purchaseDate: purchasedCourse.purchaseDate,
        lastAccessDate: purchasedCourse.lastAccessDate,
        rating: purchasedCourse.rating,
        review: purchasedCourse.review,
        orderInfo: purchasedCourse.order,
        completedAt: purchasedCourse.completedAt,
      },
    });
  } catch (err) {
    console.error("Lỗi lấy chi tiết purchased course:", err);
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
      mentee: userId,
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
          mentee: userId,
          course: courseId,
        });

        if (!existingPurchase) {
          // Lấy thông tin course để có price
          const courseInfo = await Course.findById(courseId).select("price");
          const coursePrice = courseInfo?.price || 0;

          // Tạo record purchased course mới
          await PurchasedCourse.create({
            mentee: userId,
            course: courseId,
            order: orderId,
            price: coursePrice,
            purchaseDate: new Date(),
            lastAccessDate: new Date(),
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

export default {
  getPurchasedCourses,
  getPurchasedCourseById,
  checkCoursePurchase,
  handlePurchaseSuccess,
};