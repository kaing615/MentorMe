import responseHandler from "../handlers/response.handler.js";
import Cart from "../models/cart.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import cartUtils from "../utils/cart.utils.js";

// Lấy giỏ hàng của user
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "courses.course",
      select:
        "title description price category duration rate lectures mentor thumbnail",
      populate: {
        path: "mentor",
        select: "firstName lastName avatarUrl jobTitle",
      },
    });

    // Nếu chưa có cart thì tạo cart trống
    if (!cart) {
      cart = await cartUtils.findOrCreateCart(userId);
    }

    // Cập nhật total price nếu cần
    await cartUtils.updateTotalPriceIfNeeded(cart);

    responseHandler.ok(
      res,
      {
        totalCourses: cart.courses.length,
        totalPrice: cart.totalPrice,
        courses: cart.courses,
        cart: cart,
      },
      "Lấy giỏ hàng thành công."
    );
  } catch (error) {
    console.error("Error getting cart:", error);
    responseHandler.error(res);
  }
};

// Thêm khóa học vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    // Kiểm tra khóa học có tồn tại không
    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notfound(res, "Không tìm thấy khóa học.");
    }

    // Kiểm tra user đã mua khóa học này chưa
    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.notfound(res, "Không tìm thấy người dùng.");
    }

    const alreadyPurchased = user.purchasedCourses.some(
      (pc) => pc.course.toString() === courseId
    );

    if (alreadyPurchased) {
      // console.log(`[addToCart] Course already purchased`);
      return responseHandler.badrequest(res, "Bạn đã mua khóa học này rồi.");
    }

    // Tìm hoặc tạo cart
    let cart = await cartUtils.findOrCreateCart(userId);

    // Kiểm tra khóa học đã có trong giỏ hàng chưa
    const existingCourse = cart.courses.find(
      (item) => item.course.toString() === courseId
    );

    if (existingCourse) {
      return responseHandler.badrequest(res, "Khóa học đã có trong giỏ hàng.");
    }

    // Thêm khóa học vào giỏ hàng
    cart.courses.push({
      course: courseId,
      addedAt: new Date(),
    });

    // Cập nhật total price
    cart.totalPrice += course.price;

    await cart.save();

    // Populate course info để trả về
    await cart.populate({
      path: "courses.course",
      select:
        "title description price category duration rate lectures mentor thumbnail",
      populate: {
        path: "mentor",
        select: "firstName lastName avatarUrl jobTitle",
      },
    });

    responseHandler.ok(
      res,
      {
        courseId: courseId,
        courseTitle: course.title,
        totalCourses: cart.courses.length,
        totalPrice: cart.totalPrice,
        cart: cart,
      },
      "Thêm khóa học vào giỏ hàng thành công."
    );
  } catch (error) {
    console.error("Error adding to cart:", error);
    responseHandler.error(res);
  }
};

// Xóa khóa học khỏi giỏ hàng
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    // Kiểm tra khóa học có tồn tại không
    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notfound(res, "Không tìm thấy khóa học.");
    }

    // Tìm hoặc tạo cart
    const cart = await cartUtils.findOrCreateCart(userId);

    // Tìm khóa học trong cart
    const courseIndex = cart.courses.findIndex(
      (item) => item.course.toString() === courseId
    );

    if (courseIndex === -1) {
      return responseHandler.notfound(res, "Khóa học không có trong giỏ hàng.");
    }

    // Lấy thông tin course để trừ price
    if (course) {
      cart.totalPrice -= course.price;
    }

    // Xóa khóa học khỏi cart
    cart.courses.splice(courseIndex, 1);

    // Đảm bảo totalPrice không âm
    if (cart.totalPrice < 0) {
      cart.totalPrice = 0;
    }

    await cart.save();

    responseHandler.ok(
      res,
      {
        courseId: courseId,
        totalCourses: cart.courses.length,
        totalPrice: cart.totalPrice,
      },
      "Xóa khóa học khỏi giỏ hàng thành công."
    );
  } catch (error) {
    console.error("Error removing from cart:", error);
    responseHandler.error(res);
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm hoặc tạo cart
    const cart = await cartUtils.findOrCreateCart(userId);

    cart.courses = [];
    cart.totalPrice = 0;
    await cart.save();

    responseHandler.ok(
      res,
      {
        totalCourses: 0,
        totalPrice: 0,
      },
      "Xóa toàn bộ giỏ hàng thành công."
    );
  } catch (error) {
    console.error("Error clearing cart:", error);
    responseHandler.error(res);
  }
};

// Kiểm tra khóa học có trong giỏ hàng không
const checkInCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    // Kiểm tra khóa học có tồn tại không
    const course = await Course.findById(courseId);
    if (!course) {
      return responseHandler.notfound(res, "Không tìm thấy khóa học.");
    }

    // Tìm hoặc tạo cart (mỗi user luôn có cart)
    const cart = await cartUtils.findOrCreateCart(userId);

    // Kiểm tra khóa học có trong giỏ hàng không
    const inCart = cart.courses.some(
      (item) => item.course.toString() === courseId
    );

    responseHandler.ok(
      res,
      {
        courseId: courseId,
        inCart: inCart,
      },
      "Kiểm tra giỏ hàng thành công."
    );
  } catch (error) {
    console.error("Error checking cart:", error);
    responseHandler.error(res);
  }
};

export default { addToCart, checkInCart, clearCart, getCart, removeFromCart };
