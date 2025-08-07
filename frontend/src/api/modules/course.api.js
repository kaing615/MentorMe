import publicClient from "../clients/public.client.js";
import createPrivateClient from "../clients/private.client.js";

// Tạo private client instance
const privateClient = createPrivateClient();

const courseEndpoints = {
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
    updateCourseReview: ({ courseId, reviewId }) => `courses/${courseId}/reviews/${reviewId}`,
    deleteCourseReview: ({ courseId, reviewId }) => `courses/${courseId}/reviews/${reviewId}`,
    enrollInCourse: ({ courseId }) => `courses/${courseId}/enroll`,
    unenrollFromCourse: ({ courseId }) => `courses/${courseId}/enroll`,
    addMentorToCourse: ({ courseId }) => `courses/${courseId}/mentors`,
    removeMentorFromCourse: ({ courseId, mentorId }) => `courses/${courseId}/mentors/${mentorId}`,
    addContentToCourse: ({ courseId }) => `courses/${courseId}/content`,
    removeContentFromCourse: ({ courseId, contentId }) => `courses/${courseId}/content/${contentId}`,
};

const courseApi = {
    // Lấy tất cả courses với filtering và pagination
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

    // Tạo course mới (hỗ trợ cả JSON và FormData cho file upload)
    createCourse: async (courseData) => {
        try {
            // Kiểm tra xem có file thumbnail không
            const hasFile = courseData instanceof FormData || courseData.thumbnail instanceof File;
            
            let requestData;
            let config = {};

            if (hasFile && !(courseData instanceof FormData)) {
                // Tạo FormData nếu có file nhưng chưa phải FormData
                requestData = new FormData();
                
                // Append tất cả các field từ courseData
                Object.keys(courseData).forEach(key => {
                    if (courseData[key] !== undefined && courseData[key] !== null && courseData[key] !== '') {
                        if (key === 'thumbnail' && courseData[key] instanceof File) {
                            requestData.append(key, courseData[key]);
                        } else {
                            requestData.append(key, courseData[key].toString());
                        }
                    }
                });

                config.headers = {
                    'Content-Type': 'multipart/form-data',
                };
            } else if (courseData instanceof FormData) {
                // Đã là FormData rồi
                requestData = courseData;
                config.headers = {
                    'Content-Type': 'multipart/form-data',
                };
            } else {
                // Không có file, gửi JSON
                requestData = courseData;
                config.headers = {
                    'Content-Type': 'application/json',
                };
            }

            const response = await privateClient.post(courseEndpoints.createCourse, requestData, config);
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Cập nhật course (hỗ trợ cả JSON và FormData)
    updateCourse: async ({ courseId, courseData }) => {
        try {
            const hasFile = courseData instanceof FormData || courseData.thumbnail instanceof File;
            
            let requestData;
            let config = {};

            if (hasFile && !(courseData instanceof FormData)) {
                requestData = new FormData();
                
                Object.keys(courseData).forEach(key => {
                    if (courseData[key] !== undefined && courseData[key] !== null && courseData[key] !== '') {
                        if (key === 'thumbnail' && courseData[key] instanceof File) {
                            requestData.append(key, courseData[key]);
                        } else {
                            requestData.append(key, courseData[key].toString());
                        }
                    }
                });

                config.headers = {
                    'Content-Type': 'multipart/form-data',
                };
            } else if (courseData instanceof FormData) {
                requestData = courseData;
                config.headers = {
                    'Content-Type': 'multipart/form-data',
                };
            } else {
                requestData = courseData;
                config.headers = {
                    'Content-Type': 'application/json',
                };
            }

            const response = await privateClient.put(courseEndpoints.updateCourse({ courseId }), requestData, config);
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Xóa course
    deleteCourse: async ({ courseId }) => {
        try {
            const response = await privateClient.delete(courseEndpoints.deleteCourse({ courseId }));
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Lấy courses của mentor hiện tại
    getMyCourses: async (params = {}) => {
        try {
            const response = await privateClient.get(courseEndpoints.getMyCourses, { params });
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Lấy courses của user cụ thể
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

    // Đăng ký khóa học
    enrollInCourse: async ({ courseId }) => {
        try {
            const response = await privateClient.post(courseEndpoints.enrollInCourse({ courseId }));
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Hủy đăng ký khóa học
    unenrollFromCourse: async ({ courseId }) => {
        try {
            const response = await privateClient.delete(courseEndpoints.unenrollFromCourse({ courseId }));
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Lấy reviews của course với pagination và filtering
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

    // Thêm review cho course (cần authentication và enrollment)
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

    // Cập nhật review của mình
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

    // Xóa review của mình
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

    // Thêm mentor vào course (cần authentication - admin only)
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

    // Xóa mentor khỏi course (cần authentication - admin only)
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

    // Thêm content vào course (cần authentication - mentor only)
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

    // Xóa content khỏi course (cần authentication - mentor only)
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

    // Lấy tất cả reviews từ database (có thể deprecated)
    getAllReviews: async (params = {}) => {
        try {
            const response = await publicClient.get(courseEndpoints.getAllReviews, { params });
            return { response };
        } catch (error) {
            return { error };
        }
    },

    // Helper function để tạo FormData từ course object
    createCourseFormData: (courseData) => {
        const formData = new FormData();
        
        // Mapping frontend field names to backend expected names
        const fieldMapping = {
            title: 'title',
            price: 'price', 
            courseOverview: 'courseOverview',
            keyLearningObjectives: 'keyLearningObjectives',
            category: 'category',
            level: 'level',
            lectures: 'lectures',
            duration: 'duration',
            driveLink: 'driveLink',
            thumbnail: 'thumbnail'
        };

        Object.keys(courseData).forEach(key => {
            const mappedKey = fieldMapping[key] || key;
            const value = courseData[key];
            
            if (value !== undefined && value !== null && value !== '') {
                if (key === 'thumbnail' && value instanceof File) {
                    formData.append(mappedKey, value);
                } else if (typeof value === 'object' && !(value instanceof File)) {
                    formData.append(mappedKey, JSON.stringify(value));
                } else {
                    formData.append(mappedKey, value.toString());
                }
            }
        });

        return formData;
    },

    // Helper function để validate course data trước khi submit
    validateCourseData: (courseData) => {
        const required = ['title', 'price', 'courseOverview', 'keyLearningObjectives', 'category', 'level', 'lectures', 'driveLink'];
        const missing = [];

        required.forEach(field => {
            if (!courseData[field] || courseData[field] === '') {
                missing.push(field);
            }
        });

        if (missing.length > 0) {
            return {
                isValid: false,
                missingFields: missing,
                message: `Missing required fields: ${missing.join(', ')}`
            };
        }

        // Validate price
        if (isNaN(parseFloat(courseData.price)) || parseFloat(courseData.price) < 0) {
            return {
                isValid: false,
                message: 'Price must be a valid positive number'
            };
        }

        // Validate lectures
        if (isNaN(parseInt(courseData.lectures)) || parseInt(courseData.lectures) < 1) {
            return {
                isValid: false,
                message: 'Number of lectures must be a positive integer'
            };
        }

        // Validate level
        const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        if (!validLevels.includes(courseData.level)) {
            return {
                isValid: false,
                message: 'Level must be one of: ' + validLevels.join(', ')
            };
        }

        // Validate driveLink URL
        try {
            new URL(courseData.driveLink);
        } catch (e) {
            return {
                isValid: false,
                message: 'Drive link must be a valid URL'
            };
        }

        return {
            isValid: true,
            message: 'Validation passed'
        };
    }
};

export default courseApi;
