import privateClient from "../clients/private.client";
import publicClient from "../clients/public.client";

const courseEndpoints = {
  list: "courses",
  detail: ({ id }) => `courses/${id}`,
  related: () => `courses/related`
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

  getRelatedCourses: async ({ courseId, category, limit }) => {
    try {
        // Normalize category to CSV string if it's an array
        const categoryParam = Array.isArray(category) ? category.join(',') : category;
        const response = await publicClient.get(`${courseEndpoints.related()}?courseId=${courseId}&category=${encodeURIComponent(categoryParam || '')}&limit=${limit ?? 6}`);
        return { response };
    } catch (err) { 
        return { err };
    }
  }
}

export default courseApi;
