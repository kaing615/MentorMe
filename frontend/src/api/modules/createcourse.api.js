import { configuredPrivateClient } from "../../main.jsx";

const createCourseEndpoints = {
  create: "create-course",
  formData: "create-course/form-data",
  validate: "create-course/validate",
  myCourses: "create-course/my-courses",
};

const createCourseApi = {
  createCourse: (data) => configuredPrivateClient.post(createCourseEndpoints.create, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getFormData: () => configuredPrivateClient.get(createCourseEndpoints.formData),
  validateCourse: (data) => configuredPrivateClient.post(createCourseEndpoints.validate, data),
  getMyCourses: (params) => configuredPrivateClient.get(createCourseEndpoints.myCourses, { params }),
};

export default createCourseApi;
