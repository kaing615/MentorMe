import publicClient from "../clients/public.client.js";
import createPrivateClient from "../clients/private.client.js";

const privateClient = createPrivateClient();

const ep = {
  list: "/course",
  detail: (id) => `/course/${id}`,
  related: "/course/related",
  byMentor: (mentorId) => `/course/mentor/${mentorId}`,
  myCourses: "/course/my-courses",

  // Reviews
  allReviews: "/course/reviews",
  courseReviews: (courseId) => `/course/${courseId}/reviews`,

  // CRUD
  create: "/course",
  update: (id) => `/course/${id}`,
  remove: (id) => `/course/${id}`,

  // Optional add/remove mentor & content
  addMentor: (id) => `/course/${id}/mentors`,
  removeMentor: (id, mentorId) => `/course/${id}/mentors/${mentorId}`,
  addContent: (id) => `/course/${id}/content`,
  removeContent: (id, contentId) => `/course/${id}/content/${contentId}`,
};

// Helper để luôn trả cả error và err (alias) cho code cũ
const ok = (response) => ({ response });
const fail = (error) => ({ error, err: error });

const courseApi: any = {
  // ===== FORM DATA BUILDER =====
  getList: async (params = {}) => {
    try {
      const response = await publicClient.get(ep.list, { params });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  getAllCourses: async (params = {}) => {
    try {
      const response = await publicClient.get(ep.list, { params });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  getTopCourses: async (params = {}) => {
    try {
      const response = await publicClient.get(ep.list, { params });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  getDetail: async ({ courseId }) => {
    try {
      const response = await publicClient.get(ep.detail(courseId));
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  getRelatedCourses: async ({ courseId, category, limit = 6 }) => {
    try {
      const response = await publicClient.get(ep.related, {
        params: { courseId, category, limit },
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Dùng trong mentor-profile.jsx
  // Trả về MẢNG để bạn setAllCourses(courses) trực tiếp.
  getCoursesByMentor: async (mentorId, params = {}) => {
    try {
      const response = await publicClient.get(ep.byMentor(mentorId), {
        params,
      });
      const data = response?.data;
      // Hỗ trợ nhiều dạng payload khác nhau
      if (Array.isArray(data?.courses)) return data.courses;
      if (Array.isArray(data?.data?.courses)) return data.data.courses;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  // ===== CRUD (create/update/delete) =====
  createCourse: async (formData) => {
    try {
      const response = await privateClient.post(ep.create, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // CreateCoursePage không dùng destructuring nên trả trực tiếp cũng OK,
      // nhưng vẫn tương thích khi destructuring vì promise resolve là axios response.
      return response;
    } catch (e) {
      return fail(e);
    }
  },

  updateCourse: async ({ courseId, courseData }) => {
    try {
      const response = await privateClient.put(
        ep.update(courseId),
        courseData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  deleteCourse: async ({ courseId }) => {
    try {
      const response = await privateClient.delete(ep.remove(courseId));
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  getMyCourses: async (params = {}) => {
    try {
      const response = await privateClient.get(ep.myCourses, { params });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // Kiểm tra xem user đã mua khóa học hay chưa
  checkPurchaseStatus: async (arg, dispatch) => {
    try {
      const privateClient = createPrivateClient(dispatch);
      const courseId = typeof arg === "string" ? arg : arg?.courseId;
      if (!courseId) throw new Error("Missing courseId");
      const response = await privateClient.get(
        `/course/${courseId}/purchase-status`
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // ===== REVIEWS =====
  getAllReviews: async (params = {}) => {
    try {
      const response = await publicClient.get(ep.allReviews, { params });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  getCourseReviews: async ({ courseId, params = {} }) => {
    try {
      const response = await publicClient.get(ep.courseReviews(courseId), {
        params,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  addCourseReview: async ({ courseId, reviewData }) => {
    try {
      const response = await privateClient.post(
        ep.courseReviews(courseId),
        reviewData
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  updateCourseReview: async ({ courseId, reviewId, reviewData }) => {
    try {
      const response = await privateClient.put(
        `${ep.courseReviews(courseId)}/${reviewId}`,
        reviewData
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  deleteCourseReview: async ({ courseId, reviewId }) => {
    try {
      const response = await privateClient.delete(
        `${ep.courseReviews(courseId)}/${reviewId}`
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // ===== Mentor / Content helpers (nếu có dùng) =====
  addMentorToCourse: async ({ courseId, mentorId }) => {
    try {
      const response = await privateClient.post(ep.addMentor(courseId), {
        mentorId,
      });
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  removeMentorFromCourse: async ({ courseId, mentorId }) => {
    try {
      const response = await privateClient.delete(
        ep.removeMentor(courseId, mentorId)
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  addContentToCourse: async ({ courseId, contentData }) => {
    try {
      const response = await privateClient.post(
        ep.addContent(courseId),
        contentData
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  removeContentFromCourse: async ({ courseId, contentId }) => {
    try {
      const response = await privateClient.delete(
        ep.removeContent(courseId, contentId)
      );
      return ok(response);
    } catch (e) {
      return fail(e);
    }
  },

  // ===== Tiện ích tạo FormData cho create/update =====
  createCourseFormData: (data) => {
    const formData = new FormData();

    // Các field khớp với backend (course.controller.js)
    const map = {
      title: "title",
      price: "price",
      courseOverview: "courseOverview",
      keyLearningObjectives: "keyLearningObjectives",
      category: "category",
      level: "level",
      lectures: "lectures",
      duration: "duration",
      driveLink: "driveLink",
      thumbnail: "thumbnail",
      tags: "tags",
      language: "language",
    };

    Object.keys(map).forEach((k) => {
      if (data[k] == null) return;
      if (k === "thumbnail") {
        // File ảnh
        if (data[k]) formData.append(map[k], data[k]);
      } else if (k === "tags" || k === "language") {
        // Backend chấp nhận array hoặc string JSON → gửi JSON cho chắc
        const v = Array.isArray(data[k])
          ? data[k]
          : String(data[k])
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
        formData.append(map[k], JSON.stringify(v));
      } else {
        formData.append(map[k], data[k]);
      }
    });

    // Backend validation yêu cầu ít nhất một trong description/courseOverview và link/driveLink
    // Nếu chưa có description, tạo từ courseOverview
    if (!data.description && data.courseOverview) {
      formData.append("description", data.courseOverview);
    }

    // Nếu chưa có link, dùng driveLink
    if (!data.link && data.driveLink) {
      formData.append("link", data.driveLink);
    }

    return formData;
  },
};

export default courseApi;
