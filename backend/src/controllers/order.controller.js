import responseHandler from "../handlers/response.handler.js";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";

// Tạo order từ cart
export const createOrder = async (req, res) => {
    try {
        const { billingInfo, paymentMethod, discountCode } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!billingInfo || !billingInfo.email || !billingInfo.firstName || !billingInfo.lastName) {
            return responseHandler.badRequest(res, "Thông tin thanh toán không đầy đủ!");
        }

        if (!paymentMethod) {
            return responseHandler.badRequest(res, "Vui lòng chọn phương thức thanh toán!");
        }

        // Lấy cart
        const cart = await Cart.findOne({ userId }).populate('items.courseId');
        if (!cart || cart.items.length === 0) {
            return responseHandler.badRequest(res, "Giỏ hàng trống!");
        }

        // Validate courses và tính toán lại giá
        let subtotalAmount = 0;
        const orderItems = [];
        const courseIds = [];

        for (const item of cart.items) {
            const course = await Course.findById(item.courseId);
            if (!course) {
                return responseHandler.badRequest(res, `Khóa học ${item.title} không tồn tại!`);
            }

            // TODO: Kiểm tra user đã mua course này chưa

            orderItems.push({
                courseId: course._id,
                title: course.title,
                price: course.price,
                quantity: item.quantity,
                thumbnail: course.thumbnail
            });

            courseIds.push(course._id);
            subtotalAmount += course.price * item.quantity;
        }

        // Tính discount
        const discountAmount = cart.discountAmount || 0;
        const totalAmount = subtotalAmount - discountAmount;

        // Tạo order
        const newOrder = new Order({
            mentee: userId,
            userId: userId,
            items: orderItems,
            courses: courseIds, // For backward compatibility
            type: "course",
            subtotalAmount,
            discountCode: cart.discountCode || discountCode,
            discountAmount,
            amount: totalAmount,
            totalAmount,
            billingInfo: {
                email: billingInfo.email,
                firstName: billingInfo.firstName,
                lastName: billingInfo.lastName,
                country: billingInfo.country || "Vietnam",
                address: billingInfo.address || ""
            },
            paymentInfo: {
                method: paymentMethod,
                paymentGateway: "manual"
            },
            paymentMethod,
            status: "pending"
        });

        await newOrder.save();

        // Xóa cart sau khi tạo order thành công
        await Cart.findOneAndDelete({ userId });

        return responseHandler.created(res, {
            message: "Tạo đơn hàng thành công!",
            order: {
                orderNumber: newOrder.orderNumber,
                formattedOrderNumber: newOrder.formattedOrderNumber,
                items: newOrder.items,
                summary: {
                    subtotal: subtotalAmount,
                    discount: discountAmount,
                    total: totalAmount
                },
                billingInfo: newOrder.billingInfo,
                status: newOrder.status,
                createdAt: newOrder.createdAt
            }
        });

    } catch (err) {
        console.error("Create order error:", err);
        responseHandler.error(res);
    }
};

// Lấy danh sách orders của user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;
        
        const orders = await Order.findByUserId(userId, {
            status,
            limit: parseInt(limit),
            skip,
            sort: { createdAt: -1 }
        });

        // Đếm tổng số orders
        let countQuery = { 
            $or: [
                { userId: userId },
                { mentee: userId }
            ]
        };
        
        if (status) {
            countQuery.status = status;
        }
        
        const totalOrders = await Order.countDocuments(countQuery);
        const totalPages = Math.ceil(totalOrders / limit);

        return responseHandler.ok(res, {
            orders: orders.map(order => ({
                orderNumber: order.orderNumber,
                formattedOrderNumber: order.formattedOrderNumber,
                items: order.items.length > 0 ? order.items : order.courses?.map(course => ({
                    courseId: course._id,
                    title: course.title,
                    price: course.price,
                    quantity: 1,
                    thumbnail: course.thumbnail
                })),
                totalAmount: order.totalAmount || order.amount,
                status: order.status,
                createdAt: order.createdAt,
                coursesGranted: order.coursesGranted
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        console.error("Get user orders error:", err);
        responseHandler.error(res);
    }
};

// Lấy chi tiết order
export const getOrderDetails = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const userId = req.user.id;

        const order = await Order.findOne({
            orderNumber,
            $or: [
                { userId: userId },
                { mentee: userId }
            ]
        })
        .populate('items.courseId', 'title description thumbnail price category duration')
        .populate('courses', 'title description thumbnail price category duration')
        .populate('mentee', 'firstName lastName email')
        .populate('booking');

        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        return responseHandler.ok(res, {
            order: {
                orderNumber: order.orderNumber,
                formattedOrderNumber: order.formattedOrderNumber,
                items: order.items.length > 0 ? order.items : order.courses?.map(course => ({
                    courseId: course._id,
                    title: course.title,
                    description: course.description,
                    price: course.price,
                    quantity: 1,
                    thumbnail: course.thumbnail,
                    category: course.category,
                    duration: course.duration
                })),
                summary: {
                    subtotal: order.subtotalAmount || order.amount,
                    discount: order.discountAmount || 0,
                    total: order.totalAmount || order.amount
                },
                billingInfo: order.billingInfo,
                paymentInfo: order.paymentInfo,
                status: order.status,
                coursesGranted: order.coursesGranted,
                grantedAt: order.grantedAt,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                notes: order.notes || order.note,
                refundInfo: order.refundInfo
            }
        });

    } catch (err) {
        console.error("Get order details error:", err);
        responseHandler.error(res);
    }
};

// Cập nhật trạng thái order (admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { status, notes, transactionId } = req.body;

        const order = await Order.findByOrderNumber(orderNumber);
        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        // Update status
        order.status = status;
        if (notes) {
            order.notes = notes;
            order.note = notes; // Backward compatibility
        }

        // Handle specific status updates
        switch (status) {
            case "paid":
                if (transactionId) {
                    await order.markAsPaid(transactionId);
                } else {
                    order.status = "paid";
                    await order.save();
                }
                break;
            
            case "completed":
                await order.markAsCompleted();
                // TODO: Grant course access to user
                break;
            
            case "failed":
                await order.markAsFailed(notes);
                break;
            
            case "cancelled":
                await order.markAsCancelled(notes);
                break;
            
            default:
                await order.save();
        }

        return responseHandler.ok(res, {
            message: `Cập nhật trạng thái đơn hàng thành công!`,
            order: {
                orderNumber: order.orderNumber,
                status: order.status,
                updatedAt: order.updatedAt
            }
        });

    } catch (err) {
        console.error("Update order status error:", err);
        responseHandler.error(res);
    }
};

// Hủy order
export const cancelOrder = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const order = await Order.findOne({
            orderNumber,
            $or: [
                { userId: userId },
                { mentee: userId }
            ]
        });

        if (!order) {
            return responseHandler.notFound(res, "Không tìm thấy đơn hàng!");
        }

        // Chỉ cho phép hủy order ở trạng thái pending hoặc processing
        if (!["pending", "processing"].includes(order.status)) {
            return responseHandler.badRequest(res, "Không thể hủy đơn hàng ở trạng thái này!");
        }

        await order.markAsCancelled(reason || "Hủy bởi khách hàng");

        return responseHandler.ok(res, {
            message: "Hủy đơn hàng thành công!",
            order: {
                orderNumber: order.orderNumber,
                status: order.status
            }
        });

    } catch (err) {
        console.error("Cancel order error:", err);
        responseHandler.error(res);
    }
};

// Thống kê orders của user
export const getOrderStatistics = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await Order.getOrderStats(userId);
        const statsData = stats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            completedOrders: 0
        };

        // Lấy orders gần đây
        const recentOrders = await Order.findByUserId(userId, {
            limit: 5,
            sort: { createdAt: -1 }
        });

        return responseHandler.ok(res, {
            statistics: {
                totalOrders: statsData.totalOrders,
                totalSpent: statsData.totalSpent,
                completedOrders: statsData.completedOrders,
                successRate: statsData.totalOrders > 0 
                    ? Math.round((statsData.completedOrders / statsData.totalOrders) * 100) 
                    : 0
            },
            recentOrders: recentOrders.map(order => ({
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount || order.amount,
                status: order.status,
                createdAt: order.createdAt
            }))
        });

    } catch (err) {
        console.error("Get order statistics error:", err);
        responseHandler.error(res);
    }
};

// Lấy tất cả orders (admin)
export const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'billingInfo.email': { $regex: search, $options: 'i' } },
                { 'billingInfo.firstName': { $regex: search, $options: 'i' } },
                { 'billingInfo.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .populate('mentee', 'firstName lastName email')
            .populate('items.courseId', 'title price')
            .populate('courses', 'title price')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        return responseHandler.ok(res, {
            orders: orders.map(order => ({
                orderNumber: order.orderNumber,
                formattedOrderNumber: order.formattedOrderNumber,
                customer: {
                    name: `${order.billingInfo?.firstName || ''} ${order.billingInfo?.lastName || ''}`.trim() || 
                           `${order.mentee?.firstName || ''} ${order.mentee?.lastName || ''}`.trim(),
                    email: order.billingInfo?.email || order.mentee?.email
                },
                totalAmount: order.totalAmount || order.amount,
                status: order.status,
                itemsCount: order.totalItems,
                createdAt: order.createdAt
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        console.error("Get all orders error:", err);
        responseHandler.error(res);
    }
};

export default {
    createOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatus,
    cancelOrder,
    getOrderStatistics,
    getAllOrders
};
