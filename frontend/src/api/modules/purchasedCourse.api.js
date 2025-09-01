import createPrivateClient from "../clients/private.client.js";

const purchasedCourseApi = (dispatch) => {
  const client = createPrivateClient(dispatch);
  
  return {
    getPurchasedCourses: () => client.get("/purchased-courses"),
  };
};

export default purchasedCourseApi;
