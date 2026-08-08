// routes/cart.route.js
import { Router } from "express";
import cartController from "../controllers/cart.controller.js";
import tokenMiddleware from "../middlewares/auth.middleware.js";
import cartValidator from "../middlewares/validators/cart.middleware.js";

const router = Router();

/**
 * Tất cả routes đều yêu cầu đăng nhập (Bearer token)
 */
router.use(tokenMiddleware.auth);

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: API giỏ hàng khóa học
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     tags: [Cart]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *   post:
 *     summary: Thêm khóa học vào giỏ hàng
 *     tags: [Cart]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ courseId ]
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: objectid
 *                 example: "60f7b3b3e1b3c72a8c8b4567"
 *     responses:
 *       200:
 *         description: Thêm khóa học thành công
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Đã xóa toàn bộ giỏ hàng
 */

/**
 * @swagger
 * /api/cart/{courseId}:
 *   delete:
 *     summary: Xóa 1 khóa học khỏi giỏ hàng
 *     tags: [Cart]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: objectid }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /api/cart/check/{courseId}:
 *   get:
 *     summary: Kiểm tra khóa học có trong giỏ không
 *     tags: [Cart]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: objectid }
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra
 */

// ======== Primary RESTful routes ========
router.get("/", cartController.getCart);

router.post(
  "/",
  cartValidator.addToCartValidator,
  cartValidator.handleValidationErrors,
  cartController.addToCart
);

router.delete(
  "/:courseId",
  cartValidator.removeFromCartValidator,
  cartValidator.handleValidationErrors,
  cartController.removeFromCart
);

router.delete("/", cartController.clearCart);

router.get(
  "/check/:courseId",
  cartValidator.checkInCartValidator,
  cartValidator.handleValidationErrors,
  cartController.checkInCart
);

// ======== Backward-compatible aliases (DEPRECATED) ========
// POST /api/cart/add -> alias của POST /api/cart
router.post(
  "/add",
  cartValidator.addToCartValidator,
  cartValidator.handleValidationErrors,
  cartController.addToCart
);

// PUT /api/cart/update/:courseId -> không còn hỗ trợ quantity cho khóa học
router.put("/update/:courseId", cartController.updateCartItem);

// DELETE /api/cart/remove/:courseId -> alias của DELETE /api/cart/:courseId
router.delete(
  "/remove/:courseId",
  cartValidator.removeFromCartValidator,
  cartValidator.handleValidationErrors,
  cartController.removeFromCart
);

// DELETE /api/cart/clear -> alias của DELETE /api/cart
router.delete("/clear", cartController.clearCart);

export default router;
