import createPrivateClient from "../clients/private.client.js";

const privateClient = createPrivateClient();

export const getProfile = async () => {
  return privateClient.get("/profile");
};

export const getMentorById = async (mentorId) => {
  return privateClient.get(`/profile/mentor/${mentorId}`);
};

export const getTopMentors = async (limit = 6) => {
  return privateClient.get("/profile/top-mentors", { params: { limit } });
};
export const searchMentors = async (params = {}) => {
  return privateClient.get("/profile/mentors", { params });
};
export const updateMentorProfile = async (data) => {

  const requiredFields = [
    "userName",
    "firstName",
    "lastName",
    "jobTitle",
    "category",
    "bio",
    "mentorReason",
  ];
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === "") {
      throw new Error(`Thiếu trường bắt buộc: ${field}`);
    }
  }

  if (data.bio && data.bio.length < 50) {
    throw new Error("Bio phải từ 50 ký tự trở lên.");
  }
  if (data.mentorReason && data.mentorReason.length < 20) {
    throw new Error("Lý do làm mentor phải từ 20 ký tự trở lên.");
  }
  try {
    let response;

    if (data.avatar) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "skills" && Array.isArray(value)) {
          formData.append(key, value.join(","));
        } else if (key === "links" && typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string | Blob);
        }
      });
      response = await privateClient.put("/profile/mentor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      response = await privateClient.put("/profile/mentor", data);
    }
    return response;
  } catch (error) {
    throw new Error(error?.data?.message || error?.message || "Lỗi cập nhật profile");
  }
};

export const updateMenteeProfile = async (data) => {
  try {

    const payload = { ...data };

    payload.links = {
      website: data.website || "",
      twitter: data.twitter || "",
      linkedin: data.linkedin || "",
      facebook: data.facebook || "",
    };
    delete payload.website;
    delete payload.twitter;
    delete payload.linkedin;
    delete payload.facebook;

    let response;
    if (data.avatar) {
      const formData = new FormData();

      if (data.avatar instanceof File) {
        formData.append("avatar", data.avatar);
      }

      Object.entries(payload).forEach(([key, value]) => {
        if (key === "avatar") {

          return;
        } else if (key === "links" && typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string | Blob);
        }
      });

      response = await privateClient.put("/profile/mentee", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {

      delete payload.avatar;
      response = await privateClient.put("/profile/mentee", payload);
    }
    return response;
  } catch (error) {
    throw new Error(
      error?.data?.message || error?.message || "Lỗi cập nhật profile mentee"
    );
  }
};

export const changeAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);
  return privateClient.put("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getMentorCourses = async (mentorId) => {
  return privateClient.get(`/course/mentor/${mentorId}`);
};

const profileApi: any = {
  getProfile,
  getMentorById,
  getTopMentors,
  searchMentors,
  updateMentorProfile,
  updateMenteeProfile,
  changeAvatar,
  getMentorCourses,
};

export default profileApi;
