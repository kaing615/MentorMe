import privateClient from "../clients/private.client";
import publicClient from "../clients/public.client";

const courseEndpoints = {
  list: "courses",
  detail: ({ id }) => `courses/${id}`,
  detailByName: ({ name }) => `courses/by-name/${encodeURIComponent(name)}`,
  detailBySlug: ({ slug }) => `courses/slug/${slug}`,
  create: "courses",
  update: ({ id }) => `courses/${id}`,
  delete: ({ id }) => `courses/${id}`,
  search: "courses/search",
};

const courseApi = {
  // Lấy danh sách tất cả courses
  getList: async ({ page = 1, limit = 10, category, mentor, tags } = {}) => {
    try {
      let queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        populate: 'mentor'
      });

      if (category) queryParams.append('category', category);
      if (mentor) queryParams.append('mentor', mentor);
      if (tags) queryParams.append('tags', Array.isArray(tags) ? tags.join(',') : tags);

      const response = await publicClient.get(`${courseEndpoints.list}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy course theo ID
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

  // Lấy course theo tên (title)
  getDetailByName: async ({ courseName }) => {
    try {
      const response = await publicClient.get(
        `${courseEndpoints.detailByName({ name: courseName })}?populate=mentor`
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy course theo slug (URL-friendly)
  getDetailBySlug: async ({ slug }) => {
    try {
      const response = await publicClient.get(
        `${courseEndpoints.detailBySlug({ slug })}?populate=mentor`
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Tìm kiếm courses
  search: async ({ query, category, minPrice, maxPrice, rating, level } = {}) => {
    try {
      let queryParams = new URLSearchParams({ populate: 'mentor' });
      
      if (query) queryParams.append('q', query);
      if (category) queryParams.append('category', category);
      if (minPrice) queryParams.append('minPrice', minPrice.toString());
      if (maxPrice) queryParams.append('maxPrice', maxPrice.toString());
      if (rating) queryParams.append('rating', rating.toString());
      if (level) queryParams.append('level', level);

      const response = await publicClient.get(`${courseEndpoints.search}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Tạo course mới (cần authentication)
  create: async ({
    title,
    description,
    price,
    category,
    tags,
    duration,
    lectures,
    link,
    discount = 0,
    mentorId,
    thumbnail
  }) => {
    try {
      const courseData = {
        title,
        description,
        price,
        mentor: mentorId,
        category,
        tags,
        duration,
        lectures,
        link,
        discount
      };

      if (thumbnail) courseData.thumbnail = thumbnail;

      const response = await privateClient.post(courseEndpoints.create, courseData);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Cập nhật course (cần authentication)
  update: async ({ courseId, ...courseData }) => {
    try {
      const response = await privateClient.put(
        courseEndpoints.update({ id: courseId }), 
        courseData
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Xóa course (cần authentication)
  delete: async ({ courseId }) => {
    try {
      const response = await privateClient.delete(
        courseEndpoints.delete({ id: courseId })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy courses theo mentor
  getCoursesByMentor: async ({ mentorId, page = 1, limit = 10 }) => {
    try {
      const queryParams = new URLSearchParams({
        mentor: mentorId,
        populate: 'mentor',
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await publicClient.get(`${courseEndpoints.list}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy courses theo category
  getCoursesByCategory: async ({ category, page = 1, limit = 10 }) => {
    try {
      const queryParams = new URLSearchParams({
        category,
        populate: 'mentor',
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await publicClient.get(`${courseEndpoints.list}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy courses phổ biến/hot
  getPopularCourses: async ({ limit = 10 } = {}) => {
    try {
      const queryParams = new URLSearchParams({
        sort: '-rate,-enrollments',
        limit: limit.toString(),
        populate: 'mentor'
      });

      const response = await publicClient.get(`${courseEndpoints.list}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy courses mới nhất
  getLatestCourses: async ({ limit = 10 } = {}) => {
    try {
      const queryParams = new URLSearchParams({
        sort: '-createdAt',
        limit: limit.toString(),
        populate: 'mentor'
      });

      const response = await publicClient.get(`${courseEndpoints.list}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy courses có discount
  getDiscountedCourses: async ({ limit = 10 } = {}) => {
    try {
      const queryParams = new URLSearchParams({
        discount: JSON.stringify({ $gt: 0 }),
        sort: '-discount',
        limit: limit.toString(),
        populate: 'mentor'
      });

      const response = await publicClient.get(`${courseEndpoints.list}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // Lấy courses related (cùng category hoặc tags)
  getRelatedCourses: async ({ courseId, category, tags, limit = 6 }) => {
    try {
      let queryParams = new URLSearchParams({
        limit: limit.toString(),
        populate: 'mentor'
      });

      // Exclude current course
      if (courseId) {
        queryParams.append('_id', JSON.stringify({ $ne: courseId }));
      }

      // Filter by category or tags
      if (category) {
        queryParams.append('category', category);
      }
      if (tags && tags.length > 0) {
        queryParams.append('tags', JSON.stringify({ $in: tags }));
      }

      const response = await publicClient.get(`${courseEndpoints.list}?${queryParams}`);
      return { response };
    } catch (err) {
      return { err };
    }
  }
};

export default courseApi;
