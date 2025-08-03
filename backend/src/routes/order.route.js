import { Router } from "express";
import orderController from "../controllers/order.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng từ giỏ hàng
 *     description: Tạo đơn hàng mới từ cart hiện tại của user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - billingInfo
 *               - paymentMethod
 *             properties:
 *               billingInfo:
 *                 $ref: '#/components/schemas/BillingInfo'
 *               paymentMethod:
 *                 type: string
 *                 enum: ["credit_card", "paypal", "vnpay", "momo", "bank_transfer"]
 *                 example: "vnpay"
 *               discountCode:
 *                 type: string
 *                 description: Mã giảm giá (optional)
 *                 example: "SALE20"
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
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
 *                         order:
 *                           type: object
 *                           properties:
 *                             orderNumber:
 *                               type: string
 *                               example: "1690876543210-ABC123"
 *                             formattedOrderNumber:
 *                               type: string
 *                               example: "MTM-1690876543210-ABC123"
 *                             items:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/CartItem'
 *                             summary:
 *                               type: object
 *                               properties:
 *                                 subtotal:
 *                                   type: number
 *                                 discount:
 *                                   type: number
 *                                 total:
 *                                   type: number
 *                             status:
 *                               type: string
 *                               example: "pending"
 *       400:
 *         description: Thông tin không hợp lệ hoặc giỏ hàng trống
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của user
 *     description: Trả về danh sách đơn hàng với phân trang và filter
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "processing", "paid", "completed", "failed", "cancelled", "refunded"]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Số lượng đơn hàng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
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
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               orderNumber:
 *                                 type: string
 *                               formattedOrderNumber:
 *                                 type: string
 *                               totalAmount:
 *                                 type: number
 *                               status:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             totalOrders:
 *                               type: integer
 *                             hasNextPage:
 *                               type: boolean
 *                             hasPrevPage:
 *                               type: boolean
 */

/**
 * @swagger
 * /api/orders/statistics:
 *   get:
 *     summary: Thống kê đơn hàng của user
 *     description: Trả về thống kê tổng quan về đơn hàng và đơn hàng gần đây
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             totalOrders:
 *                               type: integer
 *                               example: 15
 *                             totalSpent:
 *                               type: number
 *                               example: 2500000
 *                             completedOrders:
 *                               type: integer
 *                               example: 12
 *                             successRate:
 *                               type: integer
 *                               example: 80
 *                         recentOrders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               orderNumber:
 *                                 type: string
 *                               totalAmount:
 *                                 type: number
 *                               status:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 */

/**
 * @swagger
 * /api/orders/{orderNumber}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     description: Trả về thông tin chi tiết của một đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã đơn hàng
 *         example: "1690876543210-ABC123"
 *     responses:
 *       200:
 *         description: Lấy chi tiết đơn hàng thành công
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
 *                         order:
 *                           $ref: '#/components/schemas/Order'
 *       404:
 *         description: Không tìm thấy đơn hàng
 */

/**
 * @swagger
 * /api/orders/{orderNumber}/cancel:
 *   put:
 *     summary: Hủy đơn hàng
 *     description: Hủy đơn hàng ở trạng thái pending hoặc processing
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: "No longer needed"
 *     responses:
 *       200:
 *         description: Successfully cancelled the order
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
 *                         order:
 *                           type: object
 *                           properties:
 *                             orderNumber:
 *                               type: string
 *                             status:
 *                               type: string
 *                               example: "cancelled"
 *       400:
 *         description: Invalid order status or reason not provided
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders (Admin)
 *     description: API for admin to retrieve all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number, email, customer name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of orders
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
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               orderNumber:
 *                                 type: string
 *                               customer:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                   email:
 *                                     type: string
 *                               totalAmount:
 *                                 type: number
 *                               status:
 *                                 type: string
 *                               itemsCount:
 *                                 type: integer
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 */

/**
 * @swagger
 * /api/orders/admin/{orderNumber}/status:
 *   put:
 *     summary: Update order status (Admin)
 *     description: API for admin to update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["pending", "processing", "paid", "completed", "failed", "cancelled", "refunded"]
 *               notes:
 *                 type: string
 *                 description: Notes
 *               transactionId:
 *                 type: string
 *                 description: Transaction ID (when status = paid)
 *     responses:
 *       200:
 *         description: Successfully updated the order status
 */

// User routes (require authentication)
router.use(authMiddleware.verifyToken);

router.post("/", orderController.createOrder);                    // POST /api/orders - Tạo order từ cart
router.get("/", orderController.getUserOrders);                   // GET /api/orders - Lấy orders của user
router.get("/statistics", orderController.getOrderStatistics);    // GET /api/orders/statistics - Thống kê orders
router.get("/:orderNumber", orderController.getOrderDetails);     // GET /api/orders/:orderNumber - Chi tiết order
router.put("/:orderNumber/cancel", orderController.cancelOrder);  // PUT /api/orders/:orderNumber/cancel - Hủy order

// Admin routes (require admin role)
// TODO: Add admin middleware
router.get("/admin/all", orderController.getAllOrders);           // GET /api/orders/admin/all - Tất cả orders (admin)
router.put("/admin/:orderNumber/status", orderController.updateOrderStatus); // PUT /api/orders/admin/:orderNumber/status - Cập nhật trạng thái (admin)

export default router;
