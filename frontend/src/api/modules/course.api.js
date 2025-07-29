import publicClient from "../clients/public.client.js";
import createPrivateClient from "../clients/private.client.js";
import store from "../../redux/store.js";

// Tạo private client một cách dynamic để tránh circular import
const getPrivateClient = () => createPrivateClient(store.dispatch);

const courseEndpoints = {
  create: "courses",
  getAll: "courses",
  getMyCourses: "courses/my/courses",
  getById: (id) => `courses/${id}`,
  update: (id) => `courses/${id}`,
  delete: (id) => `courses/${id}`,
};

export const courseApi = {
  // API công khai - không cần auth
  getAllCourses: (params) => publicClient.get(courseEndpoints.getAll, { params }),
  getCourseById: (id) => publicClient.get(courseEndpoints.getById(id)),

  // API cần auth
  createCourse: (data) => getPrivateClient().post(courseEndpoints.create, data),
  getMyCourses: () => getPrivateClient().get(courseEndpoints.getMyCourses),
  updateCourse: (id, data) => getPrivateClient().put(courseEndpoints.update(id), data),
  deleteCourse: (id) => getPrivateClient().delete(courseEndpoints.delete(id)),
};
