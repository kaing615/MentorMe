import createPrivateClient from "../clients/private.client.js";
import courseApi from "./course.api.js";

const privateClient = createPrivateClient();

const endpoints = {
  list: "/reviews",
  detail: (id) => `/reviews/${id}`,
  my: "/reviews/my",
};

const reviewApi = {
  // Get reviews by target type and target ID
  getReviews: async (params = {}) => {
    try {
      const response = await privateClient.get(endpoints.list, { params });
      return { response };
    } catch (err) {x
      return { error: err };
    }
  },

  // Get current user's own reviews (reviews written by the user)
  getMyReviews: async (params = {}) => {
    try {
      const response = await privateClient.get(endpoints.my, { params });
      return { response };
    } catch (err) {
      return { error: err };
    }
  },

  // Get reviews for mentor's courses
  getMentorCourseReviews: async (mentorId) => {
    try {
      // First, get all courses by this mentor
      const courses = await courseApi.getCoursesByMentor(mentorId);

      if (!courses || courses.length === 0) {
        return { response: { data: { items: [], total: 0 } } };
      }

      // Get reviews for each course and combine them
      const allReviews = [];

      for (const basicCourse of courses) {
        try {
          // Get full course details first
          const { response: courseDetailResponse, error: courseDetailError } =
            await courseApi.getDetail({ courseId: basicCourse._id });

          if (courseDetailError) {
            console.error(
              `❌ Error getting course details for ${basicCourse.title}:`,
              courseDetailError
            );
            continue;
          }

          const fullCourse = courseDetailResponse?.data?.course;
          if (!fullCourse) {
            console.error(`❌ No course data found for ${basicCourse.title}`);
            continue;
          }

          // Now get reviews for this course
          const { response: reviewResponse, error } =
            await courseApi.getCourseReviews({
              courseId: fullCourse._id,
              params: { limit: 50 },
            });

          // Check different possible response structures
          let reviews = null;
          if (reviewResponse?.data?.items) {
            reviews = reviewResponse.data.items;
          } else if (reviewResponse?.data) {
            reviews = reviewResponse.data;
          } else if (Array.isArray(reviewResponse)) {
            reviews = reviewResponse;
          }

          if (reviews && Array.isArray(reviews) && reviews.length > 0) {
            // Add full course info to each review
            const reviewsWithCourse = reviews.map((review) => ({
              ...review,
              course: {
                _id: fullCourse._id,
                title: fullCourse.title,
                description: fullCourse.description,
                shortDescription: fullCourse.shortDescription,
                keyLearningObjectives: fullCourse.keyLearningObjectives,
                price: fullCourse.price,
                thumbnail: fullCourse.thumbnail,
                mentor: fullCourse.mentor,
                category: fullCourse.category,
                tags: fullCourse.tags,
                language: fullCourse.language,
                level: fullCourse.level,
                duration: fullCourse.duration,
                rate: fullCourse.rate,
                numberOfRatings: fullCourse.numberOfRatings,
                lectures: fullCourse.lectures,
                link: fullCourse.link,
              },
            }));
            allReviews.push(...reviewsWithCourse);
          } else if (error) {
            console.error(
              `❌ Error in courseApi.getCourseReviews for ${fullCourse.title}:`,
              error
            );
          }
        } catch (err) {
          console.error(
            `❌ Error fetching reviews for course ${basicCourse._id}:`,
            err
          );
        }
      }

      // Sort by creation date (newest first)
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const result = {
        response: {
          data: {
            items: allReviews,
            total: allReviews.length,
          },
        },
      };

      return result;
    } catch (err) {
      console.error("❌ Error in getMentorCourseReviews:", err);
      return { error: err };
    }
  },

  // Get reviews for mentor's bookings
  getBookingReviews: async (mentorId, params = {}) => {
    try {
      const response = await privateClient.get(`/reviews/booking/${mentorId}`, {
        params,
      });
      return { response };
    } catch (err) {
      console.error("❌ Error in getBookingReviews:", err);
      return { error: err };
    }
  },

  // Get reviews for a specific mentor
  getMentorReviews: async (mentorId, params = {}) => {
    try {
      const response = await privateClient.get(endpoints.list, {
        params: {
          targetType: "Mentor",
          target: mentorId,
          ...params,
        },
      });
      return { response };
    } catch (err) {
      console.error("❌ Error in getMentorReviews:", err);
      return { error: err };
    }
  },

  // Create new review
  createReview: async (reviewData) => {
    try {
      const response = await privateClient.post(endpoints.list, reviewData);
      return { response };
    } catch (err) {
      return { error: err };
    }
  },

  // Update review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await privateClient.patch(
        endpoints.detail(reviewId),
        reviewData
      );
      return { response };
    } catch (err) {
      return { error: err };
    }
  },

  // Delete review
  deleteReview: async (reviewId) => {
    try {
      const response = await privateClient.delete(endpoints.detail(reviewId));
      return { response };
    } catch (err) {
      return { error: err };
    }
  },
};

export default reviewApi;
