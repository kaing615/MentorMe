import responseHandler from "../handlers/response.handler.js";
import Cart from "../models/cart.model.js";
import Course from "../models/course.model.js";

// Thêm course vào giỏ hàng
export const addToCart = async (req, res) => {
    try {
        const { courseId, quantity = 1 } = req.body;
        const userId = req.user.id;

        // Kiểm tra course có tồn tại không
        const course = await Course.findById(courseId);
        if (!course) {
            return responseHandler.notFound(res, "Khóa học không tồn tại.");
        }

        // Kiểm tra user đã mua course này chưa
        // TODO: Implement purchased courses check

        // Tìm hoặc tạo cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                totalAmount: 0
            });
        }

        // Kiểm tra course đã có trong cart chưa
        const existingItemIndex = cart.items.findIndex(
            item => item.courseId.toString() === courseId
        );

        if (existingItemIndex > -1) {
            // Cập nhật quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Thêm item mới
            cart.items.push({
                courseId,
                quantity,
                price: course.price,
                title: course.title
            });
        }

        // Tính lại total
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        return responseHandler.ok(res, {
            message: "Đã thêm vào giỏ hàng thành công!",
            cart
        });

    } catch (err) {
        console.error("Add to cart error:", err);
        responseHandler.error(res);
    }
};

// Lấy giỏ hàng hiện tại
export const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId }).populate('items.courseId', 'title description price thumbnail');
        
        if (!cart) {
            return responseHandler.ok(res, {
                cart: {
                    items: [],
                    totalAmount: 0,
                    itemCount: 0
                }
            });
        }

        return responseHandler.ok(res, {
            cart: {
                ...cart.toObject(),
                itemCount: cart.items.length
            }
        });

    } catch (err) {
        console.error("Get cart error:", err);
        responseHandler.error(res);
    }
};

// Cập nhật số lượng trong giỏ
export const updateCartItem = async (req, res) => {
    try {
        const { courseId, quantity } = req.body;
        const userId = req.user.id;

        if (quantity <= 0) {
            return responseHandler.badRequest(res, "Số lượng phải lớn hơn 0.");
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return responseHandler.notFound(res, "Giỏ hàng không tồn tại.");
        }

        const itemIndex = cart.items.findIndex(
            item => item.courseId.toString() === courseId
        );

        if (itemIndex === -1) {
            return responseHandler.notFound(res, "Sản phẩm không có trong giỏ hàng.");
        }

        cart.items[itemIndex].quantity = quantity;

        // Tính lại total
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        return responseHandler.ok(res, {
            message: "Cập nhật giỏ hàng thành công!",
            cart
        });

    } catch (err) {
        console.error("Update cart error:", err);
        responseHandler.error(res);
    }
};

// Xóa khỏi giỏ hàng
export const removeFromCart = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return responseHandler.notFound(res, "Giỏ hàng không tồn tại.");
        }

        cart.items = cart.items.filter(
            item => item.courseId.toString() !== courseId
        );

        // Tính lại total
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        return responseHandler.ok(res, {
            message: "Đã xóa khỏi giỏ hàng!",
            cart
        });

    } catch (err) {
        console.error("Remove from cart error:", err);
        responseHandler.error(res);
    }
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await Cart.findOneAndUpdate(
            { userId },
            { 
                items: [],
                totalAmount: 0
            },
            { upsert: true }
        );

        return responseHandler.ok(res, {
            message: "Đã xóa toàn bộ giỏ hàng!",
            cart: {
                items: [],
                totalAmount: 0,
                itemCount: 0
            }
        });

    } catch (err) {
        console.error("Clear cart error:", err);
        responseHandler.error(res);
    }
};

export default {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
