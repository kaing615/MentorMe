import responseHandler from "../handlers/response.handler.js";
import Cart from "../models/cart.model.js";
import Course from "../models/course.model.js";
import Order from "../models/order.model.js";
import crypto from "crypto";

// Tạo checkout session từ cart hiện tại (frontend gọi không body)
export const createCheckoutSession = async (req, res) => {
  console.log("=== CREATE CHECKOUT SESSION START ===");
  try {
    const userId = req.user?.id;
    console.log("Create checkout session - User ID:", userId);
    console.log("Request body:", req.body);
    console.log("Request method:", req.method);

    if (!userId) {
      console.log("No user ID found");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Lấy cart hiện tại từ database (sử dụng đúng field name)
    console.log("Finding cart for user:", userId);
    const cart = await Cart.findOne({ user: userId }).populate(
      "courses.course"
    );
    console.log("Cart found:", cart);

    if (!cart) {
      console.log("No cart found for user");
      return res.status(400).json({
        success: false,
        message:
          "Không tìm thấy giỏ hàng! Vui lòng thêm khóa học vào giỏ hàng trước.",
      });
    }

    if (cart.courses.length === 0) {
      console.log("Cart exists but is empty");
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống! Vui lòng thêm khóa học vào giỏ hàng trước.",
      });
    }

    console.log("Cart courses:", cart.courses);

    // Tạo session ID
    const sessionId = crypto.randomBytes(32).toString("hex");

    // Validate và tính toán lại giá tiền
    let subtotalAmount = 0;
    const validatedItems = [];

    for (const courseItem of cart.courses) {
      const course = courseItem.course;
      if (!course) {
        return res.status(400).json({
          success: false,
          message: `Khóa học không tồn tại trong giỏ hàng!`,
        });
      }

      // Kiểm tra user đã mua course này chưa
      // TODO: Implement purchased courses check

      validatedItems.push({
        courseId: course._id,
        title: course.title,
        price: course.price,
        quantity: 1, // Cart model không hỗ trợ quantity
        thumbnail: course.thumbnail,
        addedAt: courseItem.addedAt,
      });

      subtotalAmount += course.price;
    }

    // Áp dụng discount
    const discountAmount = cart.discountAmount || 0;
    const totalAmount = subtotalAmount - discountAmount;

    // Tạo session data để trả về frontend
    const sessionData = {
      sessionId,
      userId,
      items: validatedItems,
      summary: {
        subtotal: subtotalAmount,
        discount: discountAmount,
        total: totalAmount,
      },
      status: "pending",
      createdAt: new Date(),
    };

    return responseHandler.ok(res, {
      message: "Checkout session tạo thành công!",
      session: sessionData,
      data: {
        sessionId,
        checkoutData: {
          items: validatedItems,
          summary: {
            subtotal: subtotalAmount,
            discount: discountAmount,
            total: totalAmount,
          },
        },
      },
    });
  } catch (err) {
    console.error("Create checkout session error:", err);
    console.error("Error stack:", err.stack);
    return responseHandler.error(res, "Internal server error");
  }
};

// Validate checkout data
export const validateCheckout = async (req, res) => {
  try {
    const { cartItems, discountCode } = req.body;
    const userId = req.user.id;

    // Kiểm tra cart với đúng field name
    const cart = await Cart.findOne({ user: userId }).populate(
      "courses.course"
    );
    if (!cart || cart.courses.length === 0) {
      return responseHandler.badRequest(res, "Giỏ hàng trống!");
    }

    // Validate courses vẫn còn available
    const validationResults = [];
    let totalAmount = 0;

    for (const courseItem of cart.courses) {
      const course = courseItem.course;

      if (!course) {
        validationResults.push({
          courseId: courseItem.course,
          status: "error",
          message: "Khóa học không còn tồn tại",
        });
        continue;
      }

      // Courses in cart don't have stored price, use current price
      validationResults.push({
        courseId: course._id,
        status: "ok",
        message: "Hợp lệ",
        title: course.title,
        price: course.price,
      });

      totalAmount += course.price; // Quantity always 1 for courses
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
        discountAmount: 0,
      };
    }

    const hasErrors = validationResults.some(
      (result) => result.status === "error"
    );

    return responseHandler.ok(res, {
      valid: !hasErrors,
      validationResults,
      discountValidation,
      summary: {
        subtotal: totalAmount,
        discount: discountAmount,
        total: totalAmount - discountAmount,
      },
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
      SALE20: { type: "percentage", value: 20, minAmount: 100000 },
      WELCOME50: { type: "fixed", value: 50000, minAmount: 200000 },
      STUDENT10: { type: "percentage", value: 10, minAmount: 0 },
    };

    const discount = discountCodes[code.toUpperCase()];

    if (!discount) {
      return responseHandler.badRequest(res, "Mã giảm giá không hợp lệ!");
    }

    if (cartTotal < discount.minAmount) {
      return responseHandler.badRequest(
        res,
        `Đơn hàng tối thiểu ${discount.minAmount.toLocaleString()}đ để sử dụng mã này!`
      );
    }

    // Tính discount amount
    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = Math.round((cartTotal * discount.value) / 100);
    } else {
      discountAmount = discount.value;
    }

    // Không cho discount vượt quá cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    // Cập nhật cart (tạo nếu chưa có)
    await Cart.findOneAndUpdate(
      { user: userId },
      {
        discountCode: code.toUpperCase(),
        discountAmount: discountAmount,
      },
      {
        upsert: true, // Tạo mới nếu chưa có
        new: true,
      }
    );

    return responseHandler.ok(res, {
      message: "Áp dụng mã giảm giá thành công!",
      discount: {
        code: code.toUpperCase(),
        type: discount.type,
        value: discount.value,
        discountAmount,
        finalAmount: cartTotal - discountAmount,
      },
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
      { user: userId },
      {
        discountCode: null,
        discountAmount: 0,
      }
    );

    return responseHandler.ok(res, {
      message: "Đã xóa mã giảm giá!",
    });
  } catch (err) {
    console.error("Remove discount error:", err);
    responseHandler.error(res);
  }
};

// Process payment - tạo order từ checkout session
export const processPayment = async (req, res) => {
  try {
    const { sessionId, paymentMethod, billingInfo } = req.body;
    const userId = req.user.id;

    if (!sessionId || !paymentMethod || !billingInfo) {
      return responseHandler.badRequest(res, "Thiếu thông tin thanh toán!");
    }

    // Validate billing info
    if (!billingInfo.email || !billingInfo.firstName || !billingInfo.lastName) {
      return responseHandler.badRequest(
        res,
        "Thông tin thanh toán không đầy đủ!"
      );
    }

    // Kiểm tra cart với đúng field name
    const cart = await Cart.findOne({ user: userId }).populate(
      "courses.course"
    );
    if (!cart || cart.courses.length === 0) {
      return responseHandler.badRequest(res, "Giỏ hàng trống!");
    }

    // Validate và tính toán order items từ cart.courses
    let subtotalAmount = 0;
    const orderItems = [];
    const courseIds = [];

    for (const courseItem of cart.courses) {
      const course = courseItem.course;
      if (!course) {
        return responseHandler.badRequest(
          res,
          `Khóa học không tồn tại trong giỏ hàng!`
        );
      }

      orderItems.push({
        courseId: course._id,
        title: course.title,
        price: course.price,
        quantity: 1, // Courses always quantity 1
        thumbnail: course.thumbnail || "",
      });

      courseIds.push(course._id);
      subtotalAmount += course.price;
    }

    // Áp dụng discount
    const discountAmount = cart.discountAmount || 0;
    const totalAmount = subtotalAmount - discountAmount;

    // Tạo order theo Order schema requirements
    const orderData = {
      mentee: userId, // Required field in Order schema
      userId: userId, // Backup field
      items: orderItems,
      courses: courseIds, // Additional field for course references
      type: "course",
      subtotalAmount: subtotalAmount,
      amount: totalAmount, // Required field
      totalAmount: totalAmount,
      discountCode: cart.discountCode || "",
      discountAmount: discountAmount,
      paymentMethod: paymentMethod,
      billingInfo: {
        email: billingInfo.email,
        firstName: billingInfo.firstName,
        lastName: billingInfo.lastName,
        country: billingInfo.country || "Vietnam",
        address: billingInfo.address || "",
      },
      paymentInfo: {
        method: paymentMethod,
        paymentGateway:
          paymentMethod === "vnpay"
            ? "vnpay"
            : paymentMethod === "momo"
            ? "momo"
            : "manual",
      },
      status: "pending",
      note: `Checkout session: ${sessionId}`,
    };

    // Không set orderNumber - để pre-save middleware tự động tạo
    const order = new Order(orderData);
    await order.save();

    // Clear cart sau khi tạo order thành công
    await Cart.findOneAndUpdate(
      { user: userId },
      {
        courses: [], // Xóa courses array
        discountAmount: 0,
        discountCode: null,
        totalPrice: 0,
      }
    );

    return responseHandler.ok(res, {
      message: "Tạo đơn hàng thành công!",
      order: {
        orderNumber: order.orderNumber,
        formattedOrderNumber: order.formattedOrderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items.length,
        paymentMethod: order.paymentMethod,
      },
      nextStep: {
        message: `Sử dụng orderNumber: ${order.orderNumber} để tạo link thanh toán`,
        paymentEndpoint: `/api/v1/payment/${paymentMethod}/create`,
        orderNumber: order.orderNumber,
      },
    });
  } catch (err) {
    console.error("Process payment error:", err);
    responseHandler.error(res);
  }
};

// Get available discount codes
export const getAvailableDiscounts = async (req, res) => {
  try {
    // Sử dụng discount codes có sẵn từ applyDiscount function
    const discountCodes = {
      SALE20: {
        code: "SALE20",
        description: "Giảm 20% cho đơn hàng từ 100,000đ",
        type: "percentage",
        value: 20,
        minAmount: 100000,
      },
      WELCOME50: {
        code: "WELCOME50",
        description: "Giảm 50,000đ cho đơn hàng từ 200,000đ",
        type: "fixed",
        value: 50000,
        minAmount: 200000,
      },
      STUDENT10: {
        code: "STUDENT10",
        description: "Giảm 10% không điều kiện",
        type: "percentage",
        value: 10,
        minAmount: 0,
      },
    };

    return responseHandler.ok(res, {
      message: "Lấy danh sách mã giảm giá thành công!",
      discounts: Object.values(discountCodes),
    });
  } catch (err) {
    console.error("Get available discounts error:", err);
    responseHandler.error(res);
  }
};

export default {
  createCheckoutSession,
  validateCheckout,
  applyDiscount,
  removeDiscount,
  processPayment,
  getAvailableDiscounts,
};
