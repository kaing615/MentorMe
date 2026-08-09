import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const orderApi: any = {
  // Tạo order từ checkout session
  createOrder: async (
    { billingInfo, paymentMethod, discountCode },
    dispatch
  ) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/orders", {
        billingInfo,
        paymentMethod,
        discountCode,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Lấy tất cả orders của user
  getOrders: async (dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get("/orders");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Lấy chi tiết một order
  getOrderDetails: async ({ orderId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get(`/orders/${orderId}`);
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Update order status (admin hoặc payment callback)
  updateOrderStatus: async (
    { orderId, status, transactionId, notes },
    dispatch
  ) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.put(`/orders/${orderId}/status`, {
        status,
        transactionId,
        notes,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Cancel order
  cancelOrder: async ({ orderId, reason }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.put(`/orders/${orderId}/cancel`, {
        reason,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },
};

export default orderApi;
