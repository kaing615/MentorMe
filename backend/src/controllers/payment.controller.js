import responseHandler from "../handlers/response.handler.js";
import Order from "../models/order.model.js";
import crypto from "crypto";
import axios from "axios";

// Payment configuration
const PAYMENT_CONFIG = {
    vnpay: {
        tmnCode: process.env.VNPAY_TMN_CODE || "DEMO_TMN_CODE",
        hashSecret: process.env.VNPAY_HASH_SECRET || "DEMO_HASH_SECRET",
        url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment/vnpay/return",
        ipnUrl: process.env.VNPAY_IPN_URL || "http://localhost:5000/api/payment/vnpay/ipn"
    },
    momo: {
        partnerCode: process.env.MOMO_PARTNER_CODE || "DEMO_PARTNER_CODE",
        accessKey: process.env.MOMO_ACCESS_KEY || "DEMO_ACCESS_KEY",
        secretKey: process.env.MOMO_SECRET_KEY || "DEMO_SECRET_KEY",
        endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
        redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:3000/payment/momo/return",
        ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:5000/api/payment/momo/ipn"
    },
    stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_demo",
        secretKey: process.env.STRIPE_SECRET_KEY || "sk_test_demo"
    }
};

// Tạo payment URL cho VNPay
export const createVNPayPayment = async (req, res) => {
    try {
        const { orderNumber, bankCode } = req.body;

        const order = await Order.findByOrderNumber(orderNumber);
        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        if (order.status !== "pending") {
            return responseHandler.badRequest(res, "Đơn hàng không ở trạng thái chờ thanh toán!");
        }

        const amount = order.totalAmount || order.amount;
        const createDate = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const orderId = order.orderNumber;

        // VNPay parameters
        let vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: PAYMENT_CONFIG.vnpay.tmnCode,
            vnp_Amount: amount * 100, // VNPay amount in VND cents
            vnp_CreateDate: createDate,
            vnp_CurrCode: 'VND',
            vnp_IpAddr: req.ip || '127.0.0.1',
            vnp_Locale: 'vn',
            vnp_OrderInfo: `Thanh toan don hang ${order.formattedOrderNumber}`,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: PAYMENT_CONFIG.vnpay.returnUrl,
            vnp_TxnRef: orderId
        };

        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode;
        }

        // Sort parameters
        const sortedParams = Object.keys(vnpParams).sort();
        let signData = '';
        let querystring = '';

        for (let key of sortedParams) {
            if (vnpParams[key]) {
                if (signData) {
                    signData += '&';
                    querystring += '&';
                }
                signData += `${key}=${vnpParams[key]}`;
                querystring += `${key}=${encodeURIComponent(vnpParams[key])}`;
            }
        }

        // Create signature
        const hmac = crypto.createHmac('sha512', PAYMENT_CONFIG.vnpay.hashSecret);
        const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const paymentUrl = `${PAYMENT_CONFIG.vnpay.url}?${querystring}&vnp_SecureHash=${signature}`;

        // Update order status
        order.status = "processing";
        await order.save();

        return responseHandler.ok(res, {
            message: "Tạo link thanh toán VNPay thành công!",
            paymentUrl,
            orderNumber: order.orderNumber
        });

    } catch (err) {
        console.error("Create VNPay payment error:", err);
        responseHandler.error(res);
    }
};

// Xử lý VNPay return
export const handleVNPayReturn = async (req, res) => {
    try {
        const vnpParams = req.query;
        const secureHash = vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;

        // Sort and create signature
        const sortedParams = Object.keys(vnpParams).sort();
        let signData = '';

        for (let key of sortedParams) {
            if (vnpParams[key]) {
                if (signData) signData += '&';
                signData += `${key}=${vnpParams[key]}`;
            }
        }

        const hmac = crypto.createHmac('sha512', PAYMENT_CONFIG.vnpay.hashSecret);
        const checkSignature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash !== checkSignature) {
            return responseHandler.badRequest(res, "Chữ ký không hợp lệ!");
        }

        const orderNumber = vnpParams.vnp_TxnRef;
        const transactionStatus = vnpParams.vnp_TransactionStatus;
        const transactionId = vnpParams.vnp_TransactionNo;

        const order = await Order.findByOrderNumber(orderNumber);
        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        if (transactionStatus === '00') {
            // Payment successful
            await order.markAsPaid(transactionId, "vnpay");
            
            return responseHandler.ok(res, {
                message: "Thanh toán thành công!",
                order: {
                    orderNumber: order.orderNumber,
                    status: order.status,
                    transactionId
                }
            });
        } else {
            // Payment failed
            await order.markAsFailed("Thanh toán VNPay thất bại");
            
            return responseHandler.badRequest(res, {
                message: "Thanh toán thất bại!",
                order: {
                    orderNumber: order.orderNumber,
                    status: order.status
                }
            });
        }

    } catch (err) {
        console.error("VNPay return error:", err);
        responseHandler.error(res);
    }
};

// Tạo payment cho MoMo
export const createMoMoPayment = async (req, res) => {
    try {
        const { orderNumber } = req.body;

        const order = await Order.findByOrderNumber(orderNumber);
        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        if (order.status !== "pending") {
            return responseHandler.badRequest(res, "Đơn hàng không ở trạng thái chờ thanh toán!");
        }

        const amount = order.totalAmount || order.amount;
        const requestId = `${orderNumber}_${Date.now()}`;

        const requestBody = {
            partnerCode: PAYMENT_CONFIG.momo.partnerCode,
            requestId: requestId,
            amount: amount,
            orderId: orderNumber,
            orderInfo: `Thanh toan don hang ${order.formattedOrderNumber}`,
            redirectUrl: PAYMENT_CONFIG.momo.redirectUrl,
            ipnUrl: PAYMENT_CONFIG.momo.ipnUrl,
            requestType: 'captureWallet',
            extraData: '',
            lang: 'vi'
        };

        // Create signature
        const rawSignature = `accessKey=${PAYMENT_CONFIG.momo.accessKey}&amount=${amount}&extraData=&ipnUrl=${PAYMENT_CONFIG.momo.ipnUrl}&orderId=${orderNumber}&orderInfo=${requestBody.orderInfo}&partnerCode=${PAYMENT_CONFIG.momo.partnerCode}&redirectUrl=${PAYMENT_CONFIG.momo.redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

        const signature = crypto
            .createHmac('sha256', PAYMENT_CONFIG.momo.secretKey)
            .update(rawSignature)
            .digest('hex');

        requestBody.signature = signature;

        // Call MoMo API
        const response = await axios.post(PAYMENT_CONFIG.momo.endpoint, requestBody);

        if (response.data.resultCode === 0) {
            // Update order status
            order.status = "processing";
            await order.save();

            return responseHandler.ok(res, {
                message: "Tạo link thanh toán MoMo thành công!",
                paymentUrl: response.data.payUrl,
                orderNumber: order.orderNumber
            });
        } else {
            return responseHandler.badRequest(res, "Tạo thanh toán MoMo thất bại!");
        }

    } catch (err) {
        console.error("Create MoMo payment error:", err);
        responseHandler.error(res);
    }
};

// Xử lý MoMo IPN
export const handleMoMoIPN = async (req, res) => {
    try {
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = req.body;

        // Verify signature
        const rawSignature = `accessKey=${PAYMENT_CONFIG.momo.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const expectedSignature = crypto
            .createHmac('sha256', PAYMENT_CONFIG.momo.secretKey)
            .update(rawSignature)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: "Invalid signature" });
        }

        const order = await Order.findByOrderNumber(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (resultCode === 0) {
            // Payment successful
            await order.markAsPaid(transId, "momo");
        } else {
            // Payment failed
            await order.markAsFailed(`MoMo payment failed: ${message}`);
        }

        return res.status(200).json({ message: "IPN processed successfully" });

    } catch (err) {
        console.error("MoMo IPN error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Tạo Stripe payment intent
export const createStripePayment = async (req, res) => {
    try {
        const { orderNumber } = req.body;

        const order = await Order.findByOrderNumber(orderNumber);
        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        if (order.status !== "pending") {
            return responseHandler.badRequest(res, "Đơn hàng không ở trạng thái chờ thanh toán!");
        }

        // TODO: Implement Stripe Payment Intent
        // For now, return demo response
        return responseHandler.ok(res, {
            message: "Stripe payment đang được phát triển!",
            clientSecret: "demo_client_secret",
            orderNumber: order.orderNumber
        });

    } catch (err) {
        console.error("Create Stripe payment error:", err);
        responseHandler.error(res);
    }
};

// Xác nhận thanh toán thủ công (admin)
export const confirmManualPayment = async (req, res) => {
    try {
        const { orderNumber, transactionId, notes } = req.body;

        const order = await Order.findByOrderNumber(orderNumber);
        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        await order.markAsPaid(transactionId || `MANUAL_${Date.now()}`, "manual");
        
        if (notes) {
            order.notes = notes;
            await order.save();
        }

        return responseHandler.ok(res, {
            message: "Xác nhận thanh toán thành công!",
            order: {
                orderNumber: order.orderNumber,
                status: order.status,
                transactionId: order.transactionId
            }
        });

    } catch (err) {
        console.error("Confirm manual payment error:", err);
        responseHandler.error(res);
    }
};

// Lấy trạng thái thanh toán
export const getPaymentStatus = async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const order = await Order.findByOrderNumber(orderNumber);
        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        return responseHandler.ok(res, {
            orderNumber: order.orderNumber,
            status: order.status,
            paymentInfo: order.paymentInfo,
            totalAmount: order.totalAmount || order.amount,
            paidAt: order.paymentInfo?.paidAt,
            transactionId: order.transactionId || order.paymentInfo?.transactionId
        });

    } catch (err) {
        console.error("Get payment status error:", err);
        responseHandler.error(res);
    }
};

export default {
    createVNPayPayment,
    handleVNPayReturn,
    createMoMoPayment,
    handleMoMoIPN,
    createStripePayment,
    confirmManualPayment,
    getPaymentStatus
};
