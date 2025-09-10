import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const cartApi = {
  // Lấy giỏ hàng hiện tại
  getCart: async (dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get("/cart");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Thêm khóa học vào giỏ hàng
  addToCart: async ({ courseId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/cart", { courseId });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Xóa khóa học khỏi giỏ hàng
  removeFromCart: async ({ courseId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.delete(`/cart/${courseId}`);
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async (dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.delete("/cart");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Cập nhật giỏ hàng (ví dụ discount code)
  updateCart: async ({ discountCode }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.put("/cart", { discountCode });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },
};

export default cartApi;
