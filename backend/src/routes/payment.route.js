import { Router } from "express";
import paymentController from "../controllers/payment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/payment/vnpay/return:
 *   get:
 *     summary: VNPay payment return URL
 *     description: Endpoint to handle return from VNPay after payment
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Coupon code or order number
 *       - in: query
 *         name: vnp_TransactionStatus
 *         schema:
 *           type: string
 *         description: Transaction status from VNPay
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Secure hash from VNPay
 *     responses:
 *       200:
 *         description: Successfully processed the return
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
 *         description: Failed to process return due to invalid signature
 */

/**
 * @swagger
 * /api/payment/momo/ipn:
 *   post:
 *     summary: MoMo IPN webhook
 *     description: Endpoint to handle MoMo IPN notifications
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
 *         description: Successfully processed MoMo IPN
 *       400:
 *         description: Invalid signature
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/payment/vnpay/create:
 *   post:
 *     summary: Create VNPay payment link
 *     description: Create VNPay payment URL for the order
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
 *         description: Successfully created payment link
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
 *         description: Invalid order
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/payment/momo/create:
 *   post:
 *     summary: Create MoMo payment link
 *     description: Create MoMo payment URL for the order
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
 *         description: Successfully created payment link
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
 *         description: Failed to create payment link due to invalid order
 */

/**
 * @swagger
 * /api/payment/stripe/create:
 *   post:
 *     summary: Create Stripe Payment Intent
 *     description: Create Payment Intent for Stripe payment
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
 *                 description: Order number
 *     responses:
 *       200:
 *         description: Successfully created Payment Intent
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
 *                           description: Client secret for Stripe
 *                         orderNumber:
 *                           type: string
 */

/**
 * @swagger
 * /api/payment/status/{orderNumber}:
 *   get:
 *     summary: Check payment status
 *     description: Get payment status information for the order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number
 *         example: "1690876543210-ABC123"
 *     responses:
 *       200:
 *         description: Successfully retrieved payment status
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
 *         description: Order not found
 */

/**
 * @swagger
 * /api/payment/admin/manual-confirm:
 *   post:
 *     summary: Confirm manual payment (Admin)
 *     description: API for admin to confirm manual payment
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
 *                 description: Order number
 *               transactionId:
 *                 type: string
 *                 description: Transaction ID (optional)
 *               notes:
 *                 type: string
 *                 description: Notes
 *     responses:
 *       200:
 *         description: Successfully confirmed manual payment
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
 *         description: Order not found
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
