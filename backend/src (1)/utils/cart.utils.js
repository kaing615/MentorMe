import Cart from "../models/cart.model.js";

/**
 * Tìm hoặc tạo giỏ hàng cho user
 * @param {string} userId - ID của user
 * @returns {Promise<Cart>} - Cart object
 */
const findOrCreateCart = async (userId) => {
  try {
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        courses: [],
        totalPrice: 0,
      });
      await cart.save();
    }

    return cart;
  } catch (error) {
    console.error("Error in findOrCreateCart:", error);
    throw error;
  }
};

/**
 * Tính lại tổng giá tiền của giỏ hàng
 * @param {Cart} cart - Cart object với courses đã được populate
 * @returns {number} - Tổng giá tiền
 */
const calculateTotalPrice = (cart) => {
  return cart.courses.reduce((sum, item) => {
    return sum + (item.course?.price || 0);
  }, 0);
};

/**
 * Cập nhật tổng giá tiền của giỏ hàng nếu khác với giá hiện tại
 * @param {Cart} cart - Cart object với courses đã được populate
 * @returns {Promise<boolean>} - True nếu có cập nhật, false nếu không
 */
const updateTotalPriceIfNeeded = async (cart) => {
  try {
    const calculatedTotal = calculateTotalPrice(cart);

    if (cart.totalPrice !== calculatedTotal) {
      cart.totalPrice = calculatedTotal;
      await cart.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error updating total price:", error);
    throw error;
  }
};

export default {
  findOrCreateCart,
  calculateTotalPrice,
  updateTotalPriceIfNeeded,
};
