import responseHandler from "../handlers/response.handler.js";
import Cart from "../models/cart.model.js";
import Course from "../models/course.model.js";
import Order from "../models/order.model.js";
import crypto from "crypto";

// Tạo checkout session
export const createCheckoutSession = async (req, res) => {
    try {
        const { cartItems, paymentMethod, billingInfo } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!cartItems || cartItems.length === 0) {
            return responseHandler.badRequest(res, "Giỏ hàng trống!");
        }

        if (!paymentMethod) {
            return responseHandler.badRequest(res, "Vui lòng chọn phương thức thanh toán!");
        }

        if (!billingInfo || !billingInfo.email || !billingInfo.firstName || !billingInfo.lastName) {
            return responseHandler.badRequest(res, "Thông tin thanh toán không đầy đủ!");
        }

        // Lấy cart hiện tại
        const cart = await Cart.findOne({ userId }).populate('items.courseId');
        if (!cart || cart.items.length === 0) {
            return responseHandler.badRequest(res, "Giỏ hàng trống!");
        }

        // Tạo checkout session ID
        const sessionId = crypto.randomBytes(32).toString('hex');

        // Tính toán lại giá tiền để đảm bảo chính xác
        let totalAmount = 0;
        const validatedItems = [];

        for (const item of cart.items) {
            const course = await Course.findById(item.courseId);
            if (!course) {
                return responseHandler.badRequest(res, `Khóa học ${item.title} không tồn tại!`);
            }

            // Kiểm tra user đã mua course này chưa
            // TODO: Implement purchased courses check

            validatedItems.push({
                courseId: course._id,
                title: course.title,
                price: course.price,
                quantity: item.quantity,
                thumbnail: course.thumbnail
            });

            totalAmount += course.price * item.quantity;
        }

        // Tạo checkout session data
        const checkoutSession = {
            sessionId,
            userId,
            items: validatedItems,
            totalAmount,
            discountAmount: cart.discountAmount || 0,
            finalAmount: totalAmount - (cart.discountAmount || 0),
            paymentMethod,
            billingInfo: {
                email: billingInfo.email,
                firstName: billingInfo.firstName,
                lastName: billingInfo.lastName,
                country: billingInfo.country || "Vietnam",
                address: billingInfo.address || ""
            },
            status: "pending",
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 phút
        };

        // Lưu session vào cache hoặc database tạm thời
        // TODO: Implement session storage (Redis hoặc MongoDB với TTL)

        return responseHandler.ok(res, {
            message: "Checkout session tạo thành công!",
            sessionId,
            checkoutData: {
                items: validatedItems,
                summary: {
                    subtotal: totalAmount,
                    discount: cart.discountAmount || 0,
                    total: checkoutSession.finalAmount
                },
                paymentMethod,
                billingInfo: checkoutSession.billingInfo
            }
        });

    } catch (err) {
        console.error("Create checkout session error:", err);
        responseHandler.error(res);
    }
};

// Validate checkout data
export const validateCheckout = async (req, res) => {
    try {
        const { cartItems, discountCode } = req.body;
        const userId = req.user.id;

        // Kiểm tra cart
        const cart = await Cart.findOne({ userId }).populate('items.courseId');
        if (!cart || cart.items.length === 0) {
            return responseHandler.badRequest(res, "Giỏ hàng trống!");
        }

        // Validate courses vẫn còn available
        const validationResults = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const course = await Course.findById(item.courseId);
            
            if (!course) {
                validationResults.push({
                    courseId: item.courseId,
                    status: "error",
                    message: "Khóa học không còn tồn tại"
                });
                continue;
            }

            // Kiểm tra giá có thay đổi không
            if (course.price !== item.price) {
                validationResults.push({
                    courseId: item.courseId,
                    status: "warning", 
                    message: `Giá khóa học đã thay đổi từ ${item.price}đ thành ${course.price}đ`,
                    oldPrice: item.price,
                    newPrice: course.price
                });
            } else {
                validationResults.push({
                    courseId: item.courseId,
                    status: "ok",
                    message: "Hợp lệ"
                });
            }

            totalAmount += course.price * item.quantity;
        }

        // Validate discount code nếu có
        let discountAmount = 0;
        let discountValidation = null;

        if (discountCode) {
            // TODO: Implement discount code validation
            discountValidation = {
                code: discountCode,
                valid: false,
                message: "Mã giảm giá không hợp lệ",
                discountAmount: 0
            };
        }

        const hasErrors = validationResults.some(result => result.status === "error");

        return responseHandler.ok(res, {
            valid: !hasErrors,
            validationResults,
            discountValidation,
            summary: {
                subtotal: totalAmount,
                discount: discountAmount,
                total: totalAmount - discountAmount
            }
        });

    } catch (err) {
        console.error("Validate checkout error:", err);
        responseHandler.error(res);
    }
};

// Apply discount/coupon
export const applyDiscount = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        const userId = req.user.id;

        if (!code) {
            return responseHandler.badRequest(res, "Vui lòng nhập mã giảm giá!");
        }

        // TODO: Implement discount code logic
        // Ví dụ discount codes:
        const discountCodes = {
            "SALE20": { type: "percentage", value: 20, minAmount: 100000 },
            "WELCOME50": { type: "fixed", value: 50000, minAmount: 200000 },
            "STUDENT10": { type: "percentage", value: 10, minAmount: 0 }
        };

        const discount = discountCodes[code.toUpperCase()];
        
        if (!discount) {
            return responseHandler.badRequest(res, "Mã giảm giá không hợp lệ!");
        }

        if (cartTotal < discount.minAmount) {
            return responseHandler.badRequest(res, 
                `Đơn hàng tối thiểu ${discount.minAmount.toLocaleString()}đ để sử dụng mã này!`
            );
        }

        // Tính discount amount
        let discountAmount = 0;
        if (discount.type === "percentage") {
            discountAmount = Math.round(cartTotal * discount.value / 100);
        } else {
            discountAmount = discount.value;
        }

        // Không cho discount vượt quá cart total
        discountAmount = Math.min(discountAmount, cartTotal);

        // Cập nhật cart
        await Cart.findOneAndUpdate(
            { userId },
            {
                discountCode: code.toUpperCase(),
                discountAmount: discountAmount
            }
        );

        return responseHandler.ok(res, {
            message: "Áp dụng mã giảm giá thành công!",
            discount: {
                code: code.toUpperCase(),
                type: discount.type,
                value: discount.value,
                discountAmount,
                finalAmount: cartTotal - discountAmount
            }
        });

    } catch (err) {
        console.error("Apply discount error:", err);
        responseHandler.error(res);
    }
};

// Remove discount
export const removeDiscount = async (req, res) => {
    try {
        const userId = req.user.id;

        await Cart.findOneAndUpdate(
            { userId },
            {
                discountCode: null,
                discountAmount: 0
            }
        );

        return responseHandler.ok(res, {
            message: "Đã xóa mã giảm giá!"
        });

    } catch (err) {
        console.error("Remove discount error:", err);
        responseHandler.error(res);
    }
};

export default {
    createCheckoutSession,
    validateCheckout,
    applyDiscount,
    removeDiscount
};
