import { Router } from "express";
import checkoutController from "../controllers/checkout.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/checkout/session:
 *   post:
 *     summary: Tạo checkout session
 *     description: Tạo session checkout từ giỏ hàng với thông tin thanh toán
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - billingInfo
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *                 description: Danh sách sản phẩm (optional, lấy từ cart nếu không có)
 *               paymentMethod:
 *                 type: string
 *                 enum: ["credit_card", "paypal", "vnpay", "momo", "bank_transfer"]
 *                 description: Phương thức thanh toán
 *                 example: "vnpay"
 *               billingInfo:
 *                 $ref: '#/components/schemas/BillingInfo'
 *     responses:
 *       200:
 *         description: Tạo checkout session thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sessionId:
 *                           type: string
 *                           example: "session_abc123"
 *                         checkoutData:
 *                           type: object
 *                           properties:
 *                             items:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/CartItem'
 *                             summary:
 *                               type: object
 *                               properties:
 *                                 subtotal:
 *                                   type: number
 *                                   example: 598000
 *                                 discount:
 *                                   type: number
 *                                   example: 0
 *                                 total:
 *                                   type: number
 *                                   example: 598000
 *       400:
 *         description: Thông tin không hợp lệ hoặc giỏ hàng trống
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /api/checkout/validate:
 *   post:
 *     summary: Validate thông tin checkout
 *     description: Kiểm tra tính hợp lệ của cart và discount code trước khi thanh toán
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *               discountCode:
 *                 type: string
 *                 description: Mã giảm giá cần validate
 *                 example: "SALE20"
 *     responses:
 *       200:
 *         description: Validation kết quả
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         valid:
 *                           type: boolean
 *                           example: true
 *                         validationResults:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               courseId:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                                 enum: ["ok", "warning", "error"]
 *                               message:
 *                                 type: string
 *                         summary:
 *                           type: object
 *                           properties:
 *                             subtotal:
 *                               type: number
 *                             discount:
 *                               type: number
 *                             total:
 *                               type: number
 */

/**
 * @swagger
 * /api/checkout/discount/apply:
 *   post:
 *     summary: Áp dụng mã giảm giá
 *     description: Áp dụng mã giảm giá vào cart hiện tại
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartTotal
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã giảm giá
 *                 example: "SALE20"
 *               cartTotal:
 *                 type: number
 *                 description: Tổng tiền cart hiện tại
 *                 example: 598000
 *     responses:
 *       200:
 *         description: Áp dụng mã giảm giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         discount:
 *                           type: object
 *                           properties:
 *                             code:
 *                               type: string
 *                               example: "SALE20"
 *                             type:
 *                               type: string
 *                               enum: ["percentage", "fixed"]
 *                             value:
 *                               type: number
 *                               example: 20
 *                             discountAmount:
 *                               type: number
 *                               example: 119600
 *                             finalAmount:
 *                               type: number
 *                               example: 478400
 *       400:
 *         description: Mã giảm giá không hợp lệ hoặc không đủ điều kiện
 */

/**
 * @swagger
 * /api/checkout/discount:
 *   delete:
 *     summary: Xóa mã giảm giá
 *     description: Loại bỏ mã giảm giá khỏi cart
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa mã giảm giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Đã xóa mã giảm giá!"
 */

// Tất cả routes đều cần authentication
router.use(tokenMiddleware.auth);

// Checkout routes
router.post("/session", checkoutController.createCheckoutSession);  // POST /api/checkout/session
router.post("/validate", checkoutController.validateCheckout);      // POST /api/checkout/validate
router.post("/discount/apply", checkoutController.applyDiscount);   // POST /api/checkout/discount/apply
router.delete("/discount", checkoutController.removeDiscount);      // DELETE /api/checkout/discount

export default router;
