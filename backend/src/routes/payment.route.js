import { Router } from "express";
import paymentController from "../controllers/payment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/payment/vnpay/return:
 *   get:
 *     summary: VNPay payment return URL
 *     description: Endpoint xử lý khi user quay lại từ VNPay sau khi thanh toán
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Mã đơn hàng
 *       - in: query
 *         name: vnp_TransactionStatus
 *         schema:
 *           type: string
 *         description: Trạng thái giao dịch từ VNPay
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Chữ ký bảo mật từ VNPay
 *     responses:
 *       200:
 *         description: Xử lý return thành công
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
 *                             transactionId:
 *                               type: string
 *       400:
 *         description: Thanh toán thất bại hoặc chữ ký không hợp lệ
 */

/**
 * @swagger
 * /api/payment/momo/ipn:
 *   post:
 *     summary: MoMo IPN webhook
 *     description: Endpoint nhận thông báo từ MoMo về trạng thái thanh toán
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               transId:
 *                 type: string
 *               resultCode:
 *                 type: integer
 *               message:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: IPN được xử lý thành công
 *       400:
 *         description: Chữ ký không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn hàng
 */

/**
 * @swagger
 * /api/payment/vnpay/create:
 *   post:
 *     summary: Tạo link thanh toán VNPay
 *     description: Tạo URL thanh toán VNPay cho đơn hàng
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VNPayCreateRequest'
 *     responses:
 *       200:
 *         description: Tạo link thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Đơn hàng không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn hàng
 */

/**
 * @swagger
 * /api/payment/momo/create:
 *   post:
 *     summary: Tạo link thanh toán MoMo
 *     description: Tạo URL thanh toán MoMo cho đơn hàng
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoMoCreateRequest'
 *     responses:
 *       200:
 *         description: Tạo link thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Tạo thanh toán thất bại
 */

/**
 * @swagger
 * /api/payment/stripe/create:
 *   post:
 *     summary: Tạo Stripe Payment Intent
 *     description: Tạo Payment Intent cho thanh toán qua Stripe
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderNumber
 *             properties:
 *               orderNumber:
 *                 type: string
 *                 description: Mã đơn hàng
 *     responses:
 *       200:
 *         description: Tạo Payment Intent thành công
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
 *                         clientSecret:
 *                           type: string
 *                           description: Client secret cho Stripe
 *                         orderNumber:
 *                           type: string
 */

/**
 * @swagger
 * /api/payment/status/{orderNumber}:
 *   get:
 *     summary: Kiểm tra trạng thái thanh toán
 *     description: Lấy thông tin trạng thái thanh toán của đơn hàng
 *     tags: [Payment]
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
 *         description: Lấy trạng thái thanh toán thành công
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
 *                         orderNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: ["pending", "processing", "paid", "completed", "failed", "cancelled"]
 *                         paymentInfo:
 *                           $ref: '#/components/schemas/PaymentInfo'
 *                         totalAmount:
 *                           type: number
 *                         paidAt:
 *                           type: string
 *                           format: date-time
 *                         transactionId:
 *                           type: string
 *       404:
 *         description: Không tìm thấy đơn hàng
 */

/**
 * @swagger
 * /api/payment/admin/manual-confirm:
 *   post:
 *     summary: Xác nhận thanh toán thủ công (Admin)
 *     description: API cho admin xác nhận thanh toán thủ công
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderNumber
 *             properties:
 *               orderNumber:
 *                 type: string
 *                 description: Mã đơn hàng
 *               transactionId:
 *                 type: string
 *                 description: ID giao dịch (optional)
 *               notes:
 *                 type: string
 *                 description: Ghi chú
 *     responses:
 *       200:
 *         description: Xác nhận thanh toán thành công
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
 *                               example: "paid"
 *                             transactionId:
 *                               type: string
 *       404:
 *         description: Không tìm thấy đơn hàng
 */

// Public routes (webhooks, returns)
router.get("/vnpay/return", paymentController.handleVNPayReturn);   // GET /api/payment/vnpay/return
router.post("/momo/ipn", paymentController.handleMoMoIPN);          // POST /api/payment/momo/ipn

// User routes (require authentication)
router.use(authMiddleware.verifyToken);

// Payment creation routes
router.post("/vnpay/create", paymentController.createVNPayPayment); // POST /api/payment/vnpay/create
router.post("/momo/create", paymentController.createMoMoPayment);   // POST /api/payment/momo/create
router.post("/stripe/create", paymentController.createStripePayment); // POST /api/payment/stripe/create

// Payment status
router.get("/status/:orderNumber", paymentController.getPaymentStatus); // GET /api/payment/status/:orderNumber

// Admin routes
// TODO: Add admin middleware
router.post("/admin/manual-confirm", paymentController.confirmManualPayment); // POST /api/payment/admin/manual-confirm

export default router;
