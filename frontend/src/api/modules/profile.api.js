import axios from "axios";

// Interceptor tự động gửi token cho mọi request
axios.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("actkn") ||
    localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy profile hiện tại (mentor hoặc mentee)
export const getProfile = async () => {
  const response = await axios.get("/api/v1/profile/");
  return response.data;
};

// Cập nhật profile mentor
export const updateMentorProfile = async (data, avatarFile) => {
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
  const response = await axios.put("/api/v1/profile/mentor", formData);
  return response.data;
};

// Cập nhật profile mentee
export const updateMenteeProfile = async (data, avatarFile) => {
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
  const response = await axios.put("/api/v1/profile/mentee", formData);
  return response.data;
};

// Đổi avatar riêng
export const changeAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);
  const response = await axios.post("/api/v1/profile/avatar", formData);
  return response.data;
};

export default {
  getProfile,
  updateMentorProfile,
  updateMenteeProfile,
  changeAvatar,
};
