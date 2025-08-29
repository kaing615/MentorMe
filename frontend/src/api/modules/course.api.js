import publicClient from "../clients/public.client.js";
import createPrivateClient from "../clients/private.client.js";

// Tạo private client instance
const privateClient = createPrivateClient();

const courseEndpoints = {
  list: "courses",
  detail: ({ id }) => `courses/${id}`,
  related: () => `courses/related`,
  getAllCourses: "courses",
  getAllReviews: "reviews",
  getCourseDetails: ({ courseId }) => `courses/${courseId}`,
  createCourse: "courses",
  updateCourse: ({ courseId }) => `courses/${courseId}`,
  deleteCourse: ({ courseId }) => `courses/${courseId}`,
  getMyCourses: "courses/my-courses",
  getUserCourses: ({ userId }) => `user/users/${userId}/courses`,
  getCourseReviews: ({ courseId }) => `courses/${courseId}/reviews`,
  addCourseReview: ({ courseId }) => `courses/${courseId}/reviews`,
  updateCourseReview: ({ courseId, reviewId }) =>
    `courses/${courseId}/reviews/${reviewId}`,
  deleteCourseReview: ({ courseId, reviewId }) =>
    `courses/${courseId}/reviews/${reviewId}`,
  enrollInCourse: ({ courseId }) => `courses/${courseId}/enroll`,
  unenrollFromCourse: ({ courseId }) => `courses/${courseId}/enroll`,
  addMentorToCourse: ({ courseId }) => `courses/${courseId}/mentors`,
  removeMentorFromCourse: ({ courseId, mentorId }) =>
    `courses/${courseId}/mentors/${mentorId}`,
  addContentToCourse: ({ courseId }) => `courses/${courseId}/content`,
  removeContentFromCourse: ({ courseId, contentId }) =>
    `courses/${courseId}/content/${contentId}`,
};

const courseApi = {
  getList: async ({ page = 1, limit = 10, category, mentor, tags } = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        populate: "mentor",
      });

      if (category) queryParams.append("category", category);
      if (mentor) queryParams.append("mentor", mentor);
      if (tags)
        queryParams.append("tags", Array.isArray(tags) ? tags.join(",") : tags);

      const response = await publicClient.get(
        `${courseEndpoints.list}?${queryParams}`
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  getTopCourses: async ({ limit = 6, minRate = 4.0 } = {}) => {
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        sort: "-rate",        
        populate: "mentor",
        rate: minRate.toString() 
      });

      const response = await publicClient.get(
        `${courseEndpoints.list}?${queryParams}`
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  getDetail: async ({ courseId }) => {
    try {
      const response = await publicClient.get(
        `${courseEndpoints.detail({ id: courseId })}?populate=mentor`
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  getAllCourses: async (params = {}) => {
    try {
      const response = await publicClient.get(courseEndpoints.getAllCourses, {
        params,
      });
      return { response };
    } catch (error) {
      return { error };
    }
  },

  getRelatedCourses: async ({ courseId, category, limit }) => {
    try {
      const categoryParam = Array.isArray(category)
        ? category.join(",")
        : category;

      const response = await publicClient.get(
        `${courseEndpoints.related()}?courseId=${courseId}&category=${encodeURIComponent(
          categoryParam || ""
        )}&limit=${limit ?? 6}`
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  getCourseDetails: async ({ courseId }) => {
    try {
      const response = await publicClient.get(
        courseEndpoints.getCourseDetails({ courseId })
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },

  createCourse: async (courseData) => {
    try {
      if (courseData instanceof FormData) {
        const response = await privateClient.post(
          courseEndpoints.createCourse,
          courseData
        );
        return { response };
      } else {
        const response = await privateClient.post(
          courseEndpoints.createCourse,
          courseData,
          { headers: { "Content-Type": "application/json" } }
        );
        return { response };
      }
    } catch (error) {
      return { error };
    }
  },

  updateCourse: async ({ courseId, courseData }) => {
    try {
      const hasFile =
        courseData instanceof FormData ||
        (courseData?.thumbnail instanceof File);

      let requestData;
      const config = { headers: {} };

      if (hasFile && !(courseData instanceof FormData)) {
        requestData = new FormData();
        Object.keys(courseData).forEach((key) => {
          const val = courseData[key];
          if (val !== undefined && val !== null && val !== "") {
            if (key === "thumbnail" && val instanceof File) {
              requestData.append(key, val);
            } else if (typeof val === "object" && !(val instanceof File)) {
              requestData.append(key, JSON.stringify(val));
            } else {
              requestData.append(key, String(val));
            }
          }
        });
        config.headers["Content-Type"] = "multipart/form-data";
      } else if (courseData instanceof FormData) {
        requestData = courseData;
        config.headers["Content-Type"] = "multipart/form-data";
      } else {
        requestData = courseData;
        config.headers["Content-Type"] = "application/json";
      }

      const response = await privateClient.put(
        courseEndpoints.updateCourse({ courseId }),
        requestData,
        config
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },

  deleteCourse: async ({ courseId }) => {
    try {
      const response = await privateClient.delete(
        courseEndpoints.deleteCourse({ courseId })
      );
      return { response };
    } catch (error) {
      console.error("Delete course API error:", error);
      return { error };
    }
  },

  getMyCourses: async (params = {}) => {
    try {
      const response = await privateClient.get(courseEndpoints.getMyCourses, {
        params,
      });
      return { response };
    } catch (error) {
      return { error };
    }
  },

  getUserCourses: async ({ userId, params = {} }) => {
    try {
      const response = await publicClient.get(
        courseEndpoints.getUserCourses({ userId }),
        { params }
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },

  enrollInCourse: async ({ courseId }) => {
    try {
      const response = await privateClient.post(
        courseEndpoints.enrollInCourse({ courseId })
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },
  unenrollFromCourse: async ({ courseId }) => {
    try {
      const response = await privateClient.delete(
        courseEndpoints.unenrollFromCourse({ courseId })
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },

  getCourseReviews: async ({ courseId, params = {} }) => {
    try {
      const response = await publicClient.get(
        courseEndpoints.getCourseReviews({ courseId }),
        { params }
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },
  addCourseReview: async ({ courseId, reviewData }) => {
    try {
      const response = await privateClient.post(
        courseEndpoints.addCourseReview({ courseId }),
        reviewData
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },
  updateCourseReview: async ({ courseId, reviewId, reviewData }) => {
    try {
      const response = await privateClient.put(
        courseEndpoints.updateCourseReview({ courseId, reviewId }),
        reviewData
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },
  deleteCourseReview: async ({ courseId, reviewId }) => {
    try {
      const response = await privateClient.delete(
        courseEndpoints.deleteCourseReview({ courseId, reviewId })
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },

  addMentorToCourse: async ({ courseId, mentorId }) => {
    try {
      const response = await privateClient.post(
        courseEndpoints.addMentorToCourse({ courseId }),
        { mentorId }
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },
  removeMentorFromCourse: async ({ courseId, mentorId }) => {
    try {
      const response = await privateClient.delete(
        courseEndpoints.removeMentorFromCourse({ courseId, mentorId })
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },

  addContentToCourse: async ({ courseId, contentData }) => {
    try {
      const response = await privateClient.post(
        courseEndpoints.addContentToCourse({ courseId }),
        contentData
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },
  removeContentFromCourse: async ({ courseId, contentId }) => {
    try {
      const response = await privateClient.delete(
        courseEndpoints.removeContentFromCourse({ courseId, contentId })
      );
      return { response };
    } catch (error) {
      return { error };
    }
  },

  getAllReviews: async (params = {}) => {
    try {
      const response = await publicClient.get(courseEndpoints.getAllReviews, {
        params,
      });
      return { response };
    } catch (error) {
      return { error };
    }
  },

  createCourseFormData: (courseData) => {
    const formData = new FormData();

    const fieldMapping = {
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
    };

    Object.keys(courseData).forEach((key) => {
      const mappedKey = fieldMapping[key] || key;
      const value = courseData[key];

      if (value !== undefined && value !== null && value !== "") {
        if (key === "thumbnail" && value instanceof File) {
          formData.append(mappedKey, value);
        } else if (typeof value === "object" && !(value instanceof File)) {
          formData.append(mappedKey, JSON.stringify(value));
        } else {
          formData.append(mappedKey, value.toString());
        }
      }
    });

    const description = `${courseData.courseOverview || ""}\n${
      courseData.keyLearningObjectives || ""
    }`;
    formData.set("description", description.trim());
    formData.set("link", courseData.driveLink || "");

    return formData;
  },

  validateCourseData: (courseData) => {
    const required = [
      "title",
      "price",
      "courseOverview",
      "keyLearningObjectives",
      "category",
      "level",
      "lectures",
      "driveLink",
    ];
    const missing = [];

    required.forEach((field) => {
      if (!courseData[field] || courseData[field] === "") {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      return {
        isValid: false,
        missingFields: missing,
        message: `Missing required fields: ${missing.join(", ")}`,
      };
    }

    if (isNaN(parseFloat(courseData.price)) || parseFloat(courseData.price) < 0) {
      return {
        isValid: false,
        message: "Price must be a valid positive number",
      };
    }

    if (isNaN(parseInt(courseData.lectures)) || parseInt(courseData.lectures) < 1) {
      return {
        isValid: false,
        message: "Number of lectures must be a positive integer",
      };
    }

    const validLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
    if (!validLevels.includes(courseData.level)) {
      return {
        isValid: false,
        message: "Level must be one of: " + validLevels.join(", "),
      };
    }

    try {
      new URL(courseData.driveLink);
    } catch (e) {
      return {
        isValid: false,
        message: "Drive link must be a valid URL",
      };
    }

    return { isValid: true, message: "Validation passed" };
  },

  getCoursesByMentor: async (mentorId, params = {}) => {
    try {
      const response = await publicClient.get(`/course/mentor/${mentorId}`, {
        params,
      });
      return response.data?.data?.courses || [];
    } catch (error) {
      return [];
    }
  },
};

export default courseApi;
