import createPrivateClient from "../clients/private.client.js";

const privateClient = createPrivateClient();

const profileEndpoints = {
  getProfile: "profile",
  updateMentor: "profile/mentor",
  changeAvatar: "profile/avatar",
};

const profileApi = {
  // Lấy thông tin profile user hiện tại
  getProfile: async () => {
    try {
      const response = await privateClient.get("/profile");
      return { response };
    } catch (error) {
      return { error };
    }
  },

  // Helper: Tạo FormData từ object profile
  createProfileFormData: (data) => {
    const formData = new FormData();
    for (const key in data) {
      if (key === "avatar" && data.avatar) {
        formData.append("avatar", data.avatar); // file
      } else if (key === "skills" && Array.isArray(data.skills)) {
        formData.append("skills", data.skills.join(","));
      } else if (key === "languages" && Array.isArray(data.languages)) {
        formData.append("languages", data.languages.join(","));
      } else if (typeof data[key] === "object" && data[key] !== null) {
        formData.append(key, JSON.stringify(data[key]));
      } else if (
        data[key] !== undefined &&
        data[key] !== null &&
        data[key] !== ""
      ) {
        formData.append(key, data[key]);
      }
    }
    return formData;
  },

  // Cập nhật profile cho mentor
  updateMentorProfile: async (data) => {
    try {
      const formData = profileApi.createProfileFormData(data);
      const response = await privateClient.put("/profile/mentor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { response };
    } catch (error) {
      return { error };
    }
  },

  // Cập nhật profile cho mentee
  updateMenteeProfile: async (data) => {
    try {
      const formData = profileApi.createProfileFormData(data);
      const response = await privateClient.put("/profile/mentee", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { response };
    } catch (error) {
      return { error };
    }
  },

  // Đổi avatar riêng biệt
  changeAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await privateClient.put("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { response };
    } catch (error) {
      return { error };
    }
  },
};

export default profileApi;
