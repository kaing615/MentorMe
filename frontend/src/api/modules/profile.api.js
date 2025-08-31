import createPrivateClient from "../clients/private.client.js";

const profileEndpoints = {
  getProfile: "/profile/",
  updateMentorProfile: "/profile/mentor",
  updateMenteeProfile: "/profile/mentee", 
  changeAvatar: "/profile/avatar",
};

const profileApi = (dispatch) => {
  const client = createPrivateClient(dispatch);

  return {
    // Lấy profile hiện tại (mentor hoặc mentee)
    getProfile: async () => {
      try {
        console.log("Profile API: calling GET /profile/");
        const response = await client.get(profileEndpoints.getProfile);
        console.log("Profile API response:", response);
        return response;
      } catch (error) {
        console.error("Profile API getProfile error:", error);
        throw error;
      }
    },

    // Cập nhật profile mentor
    updateMentorProfile: async (data, avatarFile) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === "object" && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      if (avatarFile) formData.append("avatar", avatarFile);
      const response = await client.put(profileEndpoints.updateMentorProfile, formData);
      return response;
    },

    // Cập nhật profile mentee
    updateMenteeProfile: async (data, avatarFile) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === "object" && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      if (avatarFile) formData.append("avatar", avatarFile);
      const response = await client.put(profileEndpoints.updateMenteeProfile, formData);
      return response;
    },

    // Đổi avatar riêng
    changeAvatar: async (avatarFile) => {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const response = await client.put(profileEndpoints.changeAvatar, formData);
      return response;
    },
  };
};

export default profileApi;
