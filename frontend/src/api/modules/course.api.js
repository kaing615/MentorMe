import publicClient from "../clients/public.client.js";
import createPrivateClient from "../clients/private.client.js";

// Tạo private client instance
const privateClient = createPrivateClient();

const courseEndpoints = {
    getAllCourses: "courses",
    getCourseDetails: ({ courseId }) => `courses/${courseId}`,
    createCourse: "courses",
    getUserCourses: ({ userId }) => `user/users/${userId}/courses`,
    getCourseReviews: ({ courseId }) => `courses/${courseId}/reviews`,
    addCourseReview: ({ courseId }) => `courses/${courseId}/reviews`,
    addMentorToCourse: ({ courseId }) => `courses/${courseId}/mentors`,
    removeMentorFromCourse: ({ courseId, mentorId }) => `courses/${courseId}/mentors/${mentorId}`,
    addContentToCourse: ({ courseId }) => `courses/${courseId}/content`,
    removeContentFromCourse: ({ courseId, contentId }) => `courses/${courseId}/content/${contentId}`,
};

const courseApi = {
    // Lấy tất cả courses
    getAllCourses: async (params = {}) => {
        try {
            const response = await publicClient.get(courseEndpoints.getAllCourses, { params });
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Lấy chi tiết course
    getCourseDetails: async ({ courseId }) => {
        try {
            const response = await publicClient.get(courseEndpoints.getCourseDetails({ courseId }));
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Lấy courses của user
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

    // Tạo course mới (cần authentication)
    createCourse: async (courseData) => {
        try {
            const response = await privateClient.post(courseEndpoints.createCourse, courseData);
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Lấy reviews của course (public)
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

    // Thêm review cho course (cần authentication)
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

    // Thêm mentor vào course (cần authentication)
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

    // Xóa mentor khỏi course (cần authentication)
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

    // Thêm content vào course (cần authentication)
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

    // Xóa content khỏi course (cần authentication)
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
};

export default courseApi;
