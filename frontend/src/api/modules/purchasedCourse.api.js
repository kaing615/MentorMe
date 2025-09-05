import createPrivateClient from "../clients/private.client.js";

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const purchasedCourseApi = {
  // Lấy tất cả khóa học đã mua của user
  getPurchasedCourses: async (dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get("/purchased-courses");
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Lấy chi tiết một khóa học đã mua
  getPurchasedCourseDetails: async ({ courseId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.get(
        `/purchased-courses/${courseId}`
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Cập nhật tiến độ học tập
  updateProgress: async ({ courseId, progress }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.put(
        `/purchased-courses/${courseId}/progress`,
        {
          progress,
        }
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Đánh dấu hoàn thành khóa học
  completeCourse: async ({ courseId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.put(
        `/purchased-courses/${courseId}/complete`
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Tạo khóa học đã mua mới (thêm khóa học vào danh sách đã mua)
  createPurchasedCourse: async (
    { courseId, price, purchaseDate },
    dispatch
  ) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post("/purchased-courses", {
        courseId,
        price,
        purchaseDate,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Xử lý khi thanh toán thành công - tự động thêm courses từ order
  handlePurchaseSuccess: async ({ orderId }, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const response = await privateClient.post(
        "/purchased-courses/purchase-success",
        {
          orderId,
        }
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },
};

export default purchasedCourseApi;
