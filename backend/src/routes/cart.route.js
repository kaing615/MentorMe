import { Router } from "express";
import cartController from "../controllers/cart.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     description: Thêm một khóa học vào giỏ hàng của người dùng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: objectid
 *                 description: ID của khóa học
 *                 example: "60f7b3b3e1b3c72a8c8b4567"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Số lượng
 *                 example: 1
 *     responses:
 *       200:
 *         description: Thêm vào giỏ hàng thành công
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
 *                           example: "Đã thêm khóa học vào giỏ hàng!"
 *                         cartItemsCount:
 *                           type: integer
 *                           example: 3
 *       400:
 *         description: Lỗi validation hoặc khóa học không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     description: Trả về toàn bộ giỏ hàng với thông tin chi tiết các khóa học
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
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
 *                         cart:
 *                           $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Giỏ hàng trống
 */

/**
 * @swagger
 * /api/cart/update/{courseId}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     description: Thay đổi số lượng của một khóa học trong giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID của khóa học cần cập nhật
 *         example: "60f7b3b3e1b3c72a8c8b4567"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Số lượng mới
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                           example: "Cập nhật giỏ hàng thành công!"
 *                         cart:
 *                           $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Số lượng không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm trong giỏ hàng
 */

/**
 * @swagger
 * /api/cart/remove/{courseId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     description: Loại bỏ một khóa học khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID của khóa học cần xóa
 *         example: "60f7b3b3e1b3c72a8c8b4567"
 *     responses:
 *       200:
 *         description: Xóa thành công
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
 *                           example: "Đã xóa khóa học khỏi giỏ hàng!"
 *       404:
 *         description: Không tìm thấy sản phẩm trong giỏ hàng
 */

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     description: Loại bỏ tất cả sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa giỏ hàng thành công
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
 *                           example: "Đã xóa toàn bộ giỏ hàng!"
 *       404:
 *         description: Giỏ hàng trống
 */

// Tất cả routes đều cần authentication
router.use(authMiddleware.verifyToken);

// Cart routes
router.post("/add", cartController.addToCart);              // POST /api/cart/add
router.get("/", cartController.getCart);                    // GET /api/cart
router.put("/update/:courseId", cartController.updateCartItem); // PUT /api/cart/update/:courseId
router.delete("/remove/:courseId", cartController.removeFromCart); // DELETE /api/cart/remove/:courseId
router.delete("/clear", cartController.clearCart);          // DELETE /api/cart/clear

export default router;
