import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const checkoutApi: any = {
  createPayment: async ({ provider, orderNumber }) => {
    try {
      const privateClient = createPrivateClient();
      const response = await privateClient.post(`/payment/${provider}/create`, {
        orderNumber,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },
};

export default checkoutApi;
