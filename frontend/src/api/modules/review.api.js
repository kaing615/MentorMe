import createPrivateClient from "../clients/private.client.js";
import courseApi from "./course.api.js";

const privateClient = createPrivateClient();

const endpoints = {
  list: "/reviews",
  detail: (id) => `/reviews/${id}`,
};

const reviewApi = {
  // Get reviews by target type and target ID
  getReviews: async (params = {}) => {
    try {
      const response = await privateClient.get(endpoints.list, { params });
      return { response };
    } catch (err) {
      return { error: err };
    }
  },

  // Get reviews for mentor's courses
  getMentorCourseReviews: async (mentorId) => {
    try {
      console.log("🔍 Getting courses for mentor:", mentorId);

      // First, get all courses by this mentor
      const courses = await courseApi.getCoursesByMentor(mentorId);
      console.log("📚 Found courses:", courses);

      if (!courses || courses.length === 0) {
        console.log("⚠️ No courses found for mentor");
        return { response: { data: { items: [], total: 0 } } };
      }

      // Get reviews for each course and combine them
      const allReviews = [];

      for (const basicCourse of courses) {
        try {
          console.log(
            `🔍 Getting full details for course: ${basicCourse.title} (${basicCourse._id})`
          );

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

          console.log(
            `📊 Full course data for ${fullCourse.title}:`,
            fullCourse
          );

          // Now get reviews for this course
          const { response: reviewResponse, error } =
            await courseApi.getCourseReviews({
              courseId: fullCourse._id,
              params: { limit: 50 },
            });

          console.log(`📝 Reviews for ${fullCourse.title}:`, {
            reviewResponse,
            error,
          });
          console.log(
            `🔍 reviewResponse structure:`,
            JSON.stringify(reviewResponse, null, 2)
          );

          // Check different possible response structures
          let reviews = null;
          if (reviewResponse?.data?.items) {
            reviews = reviewResponse.data.items;
          } else if (reviewResponse?.data) {
            reviews = reviewResponse.data;
          } else if (Array.isArray(reviewResponse)) {
            reviews = reviewResponse;
          }

          console.log(`📋 Extracted reviews:`, reviews);

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
            console.log(
              `✅ Added ${reviewsWithCourse.length} reviews for ${fullCourse.title}`
            );
            console.log(`📊 Sample course data:`, reviewsWithCourse[0]?.course);
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

      console.log("🎯 Total reviews collected:", allReviews.length);

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

      console.log("📤 Returning reviews result:", result);
      return result;
    } catch (err) {
      console.error("❌ Error in getMentorCourseReviews:", err);
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
