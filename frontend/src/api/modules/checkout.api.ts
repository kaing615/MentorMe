import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const checkoutApi: any = {
  // Tạo checkout session
  createCheckoutSession: async () => {
    try {
      const privateClient = createPrivateClient();
      const response = await privateClient.post("/checkout");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Validate checkout trước khi thanh toán
  validateCheckout: async ({ sessionId }) => {
    try {
      const privateClient = createPrivateClient();
      const response = await privateClient.post("/checkout/validate", {
        sessionId,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Process payment với payment gateway
  processPayment: async ({ sessionId, paymentMethod, billingInfo }) => {
    try {
      const privateClient = createPrivateClient();
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
};

export default checkoutApi;
