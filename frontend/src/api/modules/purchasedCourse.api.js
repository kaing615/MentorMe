import createPrivateClient from "../clients/private.client";

const privateClient = createPrivateClient();

const purchasedCourseApi = {
  getPurchasedCourses: () => privateClient.get("/purchased-courses"),
};

export default purchasedCourseApi;
