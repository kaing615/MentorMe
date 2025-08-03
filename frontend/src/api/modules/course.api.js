import { configuredPrivateClient } from "../../main.jsx";
import publicClient from "../clients/public.client.js";

const courseEndpoints = {
  create: "courses",
  getAll: "courses",
  getById: (id) => `courses/${id}`,
  update: (id) => `courses/${id}`,
  delete: (id) => `courses/${id}`,
  getByMentor: (mentorId) => `courses/mentor/${mentorId}`,
  search: "courses/search",
};

export const courseApi = {
  // Create a new course (requires authentication)
  createCourse: (data) => configuredPrivateClient.post(courseEndpoints.create, data),
  
  // Get all courses (public)
  getAllCourses: (params) => publicClient.get(courseEndpoints.getAll, { params }),
  
  // Get course by ID (public)
  getCourseById: (id) => publicClient.get(courseEndpoints.getById(id)),
  
  // Update course (requires authentication)
  updateCourse: (id, data) => configuredPrivateClient.put(courseEndpoints.update(id), data),
  
  // Delete course (requires authentication)
  deleteCourse: (id) => configuredPrivateClient.delete(courseEndpoints.delete(id)),
  
  // Get courses by mentor (public)
  getCoursesByMentor: (mentorId) => publicClient.get(courseEndpoints.getByMentor(mentorId)),
  
  // Search courses (public)
  searchCourses: (query, params) => publicClient.get(courseEndpoints.search, { 
    params: { q: query, ...params } 
  }),
};
