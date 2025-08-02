import express from "express";
import cartController from "../controllers/cart.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import cartValidator from "../middlewares/validators/cart.middleware.js";

const router = express.Router();

// Tất cả cart routes đều cần authentication
router.use(tokenMiddleware.auth);

/**
 * @route   GET /api/cart
 * @desc    Lấy giỏ hàng của người dùng hiện tại
 * @access  Private (Yêu cầu token)
 * @return  {
 *   success: true,
 *   data: {
 *     totalCourses: number,
 *     totalPrice: number,
 *     courses: [
 *       {
 *         course: {
 *           _id: string,
 *           title: string,
 *           description: string,
 *           price: number,
 *           category: string,
 *           duration: number,
 *           rate: number,
 *           lectures: number,
 *           thumbnail: string,
 *           mentor: {
 *             _id: string,
 *             firstName: string,
 *             lastName: string,
 *             avatarUrl: string,
 *             jobTitle: string
 *           }
 *         },
 *         addedAt: Date
 *       }
 *     ],
 *     cart: Cart Object
 *   },
 *   message: "Lấy giỏ hàng thành công."
 * }
 * @note Giỏ hàng sẽ được tự động tạo nếu chưa tồn tại và totalPrice sẽ được tự động cập nhật
 */
router.get("/", cartController.getCart);

/**
 * @route   POST /api/cart
 * @desc    Thêm khóa học vào giỏ hàng
 * @access  Private (Yêu cầu token)
 * @body    { courseId: string }
 * @return  {
 *   success: true,
 *   data: {
 *     courseId: string,
 *     courseTitle: string,
 *     totalCourses: number,
 *     totalPrice: number,
 *     cart: Cart Object
 *   },
 *   message: "Thêm khóa học vào giỏ hàng thành công."
 * }
 * @errors
 *   - 400: Course ID không hợp lệ (validation middleware)
 *   - 404: Không tìm thấy khóa học
 *   - 400: Bạn đã mua khóa học này rồi
 *   - 400: Khóa học đã có trong giỏ hàng
 * @validation
 *   - courseId: required, valid MongoDB ObjectId
 */
router.post(
  "/",
  cartValidator.addToCartValidator,
  cartValidator.handleValidationErrors,
  cartController.addToCart
);

/**
 * @route   DELETE /api/cart/:courseId
 * @desc    Xóa khóa học khỏi giỏ hàng
 * @access  Private (Yêu cầu token)
 * @params  courseId - ID của khóa học cần xóa (MongoDB ObjectId)
 * @return  {
 *   success: true,
 *   data: {
 *     courseId: string,
 *     totalCourses: number,
 *     totalPrice: number
 *   },
 *   message: "Xóa khóa học khỏi giỏ hàng thành công."
 * }
 * @errors
 *   - 400: Course ID không hợp lệ (validation middleware)
 *   - 404: Khóa học không có trong giỏ hàng
 * @validation
 *   - courseId: required, valid MongoDB ObjectId
 * @note Giỏ hàng sẽ được tự động tạo nếu chưa tồn tại
 */
router.delete(
  "/:courseId",
  cartValidator.removeFromCartValidator,
  cartValidator.handleValidationErrors,
  cartController.removeFromCart
);

/**
 * @route   DELETE /api/cart
 * @desc    Xóa toàn bộ giỏ hàng (làm trống giỏ hàng)
 * @access  Private (Yêu cầu token)
 * @return  {
 *   success: true,
 *   data: {
 *     totalCourses: 0,
 *     totalPrice: 0
 *   },
 *   message: "Xóa toàn bộ giỏ hàng thành công."
 * }
 * @note Giỏ hàng sẽ được tự động tạo nếu chưa tồn tại
 */
router.delete("/", cartController.clearCart);

/**
 * @route   GET /api/cart/check/:courseId
 * @desc    Kiểm tra xem khóa học có trong giỏ hàng của người dùng không
 * @access  Private (Yêu cầu token)
 * @params  courseId - ID của khóa học cần kiểm tra (MongoDB ObjectId)
 * @return  {
 *   success: true,
 *   data: {
 *     courseId: string,
 *     inCart: boolean
 *   },
 *   message: "Kiểm tra giỏ hàng thành công."
 * }
 * @errors
 *   - 400: Course ID không hợp lệ (validation middleware)
 *   - 404: Không tìm thấy khóa học
 * @validation
 *   - courseId: required, valid MongoDB ObjectId
 * @note Giỏ hàng sẽ được tự động tạo nếu chưa tồn tại
 */
router.get(
  "/check/:courseId",
  cartValidator.checkInCartValidator,
  cartValidator.handleValidationErrors,
  cartController.checkInCart
);

export default router;
