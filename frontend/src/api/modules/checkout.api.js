import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const checkoutApi = {
  // Tạo checkout session
  createCheckoutSession: async (dispatch = null) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/checkout");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Validate checkout trước khi thanh toán
  validateCheckout: async ({ sessionId, dispatch = null }) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/checkout/validate", {
        sessionId,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Process payment với payment gateway
  processPayment: async ({
    sessionId,
    paymentMethod,
    billingInfo,
    dispatch = null,
  }) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/checkout/payment", {
        sessionId,
        paymentMethod,
        billingInfo,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Get available discount codes
  getAvailableDiscounts: async (dispatch = null) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get("/checkout/discounts");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Apply discount code
  applyDiscount: async ({ code, cartTotal, dispatch = null }) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/checkout/discount/apply", {
        code,
        cartTotal,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Remove discount code
  removeDiscount: async (dispatch = null) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.delete("/checkout/discount");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Validate coupon (alias for applyDiscount for backwards compatibility)
  validateCoupon: async ({ code, cartTotal, dispatch = null }) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/checkout/discount/apply", {
        code,
        cartTotal,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },
};

export default checkoutApi;
