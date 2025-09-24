import responseHandler from "../handlers/response.handler.js";
import Cart from "../models/cart.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import cartUtils from "../utils/cart.utils.js";

/**
 * NOTE:
 * - Schema dùng: Cart { user, courses: [{ course, addedAt }], totalPrice }
 * - Không hỗ trợ quantity (khóa học = sản phẩm mua 1 lần).
 * - Dùng cartUtils.findOrCreateCart & updateTotalPriceIfNeeded để đảm bảo nhất quán.
 * - Chuẩn hóa responseHandler: ok / notFound / badRequest / error
 */

// GET /cart - Lấy giỏ hàng hiện tại
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "courses.course",
      select:
        "title description price category duration rate lectures mentor thumbnail",
      populate: {
        path: "mentor",
        select: "firstName lastName avatarUrl jobTitle",
      },
    });

    // Nếu chưa có cart -> tạo cart trống
    if (!cart) {
      cart = await cartUtils.findOrCreateCart(userId);
    }

    // Cập nhật totalPrice nếu cần (phòng khi giá khóa học thay đổi)
    await cartUtils.updateTotalPriceIfNeeded(cart);

    return responseHandler.ok(res, {
      message: "Lấy giỏ hàng thành công.",
      totalCourses: cart.courses.length,
      totalPrice: cart.totalPrice,
      courses: cart.courses,
      cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return responseHandler.error(res);
  }
};

// POST /cart - Thêm khóa học vào giỏ hàng
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { courseId } = req.body;

    // 1) Khóa học tồn tại?
    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Không tìm thấy khóa học.");
    }

    // 2) Người dùng tồn tại?
    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notFound(res, "Không tìm thấy người dùng.");
    }

    // 3) Đã mua trước đó? Check if user is in course.mentees array
    const alreadyPurchased = course.mentees?.some(
      (menteeId) => menteeId.toString() === userId.toString()
    );
    if (alreadyPurchased) {
      return responseHandler.badRequest(res, "Bạn đã mua khóa học này rồi.");
    }

    // 4) Tìm/tạo giỏ
    const cart = await cartUtils.findOrCreateCart(userId);

    // 5) Đã có trong giỏ?
    const exists = cart.courses.some(
      (item) => item.course.toString() === courseId
    );
    if (exists) {
      return responseHandler.badRequest(res, "Khóa học đã có trong giỏ hàng.");
    }

    // 6) Thêm vào giỏ
    cart.courses.push({ course: courseId, addedAt: new Date() });

    // 7) Cập nhật tổng tiền (dùng utils cho chắc)
    await cartUtils.updateTotalPriceIfNeeded(cart);

    await cart.save();

    // 8) Populate để trả về đầy đủ
    await cart.populate({
      path: "courses.course",
      select:
        "title description price category duration rate lectures mentor thumbnail",
      populate: {
        path: "mentor",
        select: "firstName lastName avatarUrl jobTitle",
      },
    });

    return responseHandler.ok(res, {
      message: "Thêm khóa học vào giỏ hàng thành công.",
      courseId,
      courseTitle: course.title,
      totalCourses: cart.courses.length,
      totalPrice: cart.totalPrice,
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return responseHandler.error(res);
  }
};

// DELETE /cart/:courseId - Xóa khóa học khỏi giỏ
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { courseId } = req.params;

    // Tồn tại khóa học?
    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Không tìm thấy khóa học.");
    }

    const cart = await cartUtils.findOrCreateCart(userId);

    const idx = cart.courses.findIndex(
      (item) => item.course.toString() === courseId
    );
    if (idx === -1) {
      return responseHandler.notFound(res, "Khóa học không có trong giỏ hàng.");
    }

    cart.courses.splice(idx, 1);

    // Cập nhật tổng tiền an toàn
    await cartUtils.updateTotalPriceIfNeeded(cart);

    await cart.save();

    return responseHandler.ok(res, {
      message: "Xóa khóa học khỏi giỏ hàng thành công.",
      courseId,
      totalCourses: cart.courses.length,
      totalPrice: cart.totalPrice,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return responseHandler.error(res);
  }
};

// DELETE /cart - Xóa toàn bộ giỏ hàng
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const cart = await cartUtils.findOrCreateCart(userId);
    cart.courses = [];
    cart.totalPrice = 0;

    await cart.save();

    return responseHandler.ok(res, {
      message: "Xóa toàn bộ giỏ hàng thành công.",
      totalCourses: 0,
      totalPrice: 0,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return responseHandler.error(res);
  }
};

// GET /cart/check/:courseId - Kiểm tra khóa học có trong giỏ không
export const checkInCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notFound(res, "Không tìm thấy khóa học.");
    }

    const cart = await cartUtils.findOrCreateCart(userId);
    const inCart = cart.courses.some(
      (item) => item.course.toString() === courseId
    );

    return responseHandler.ok(res, {
      message: "Kiểm tra giỏ hàng thành công.",
      courseId,
      inCart,
    });
  } catch (error) {
    console.error("Check in cart error:", error);
    return responseHandler.error(res);
  }
};

/**
 * Giữ API tương thích nhưng báo lỗi do khóa học không có khái niệm quantity.
 * Nếu sau này em bán vật phẩm có số lượng, tách sang model CartItem khác.
 */
// PATCH /cart/item - KHÔNG HỖ TRỢ quantity cho khóa học
export const updateCartItem = async (req, res) => {
  try {
    return responseHandler.badRequest(
      res,
      "Khóa học là sản phẩm mua 1 lần, không hỗ trợ thay đổi số lượng."
    );
  } catch (error) {
    return responseHandler.error(res);
  }
};

export default {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  checkInCart,
  updateCartItem, // giữ route cho backward-compatibility
};