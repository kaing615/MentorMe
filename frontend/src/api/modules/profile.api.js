import { getAccessToken } from "../../auth/session.js";
import axios from "axios";
// Thêm interceptor để tự động gửi token cho mọi request
axios.interceptors.request.use((config) => {
  const token =
    getAccessToken() ||
    getAccessToken() ||
    getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Lấy profile hiện tại (mentor hoặc mentee, tự động phân loại)
export const getProfile = async () => {
  try {
    const response = await axios.get(`/api/v1/profile/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin mentor theo ID (public API, không cần token)
export const getMentorById = async (mentorId) => {
  try {
    const response = await axios.get(`/api/v1/profile/mentor/${mentorId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách top mentors (public API, không cần token)
export const getTopMentors = async (limit = 6) => {
  try {
    const response = await axios.get(
      `/api/v1/profile/top-mentors?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}; // Cập nhật profile mentor
export const updateMentorProfile = async (data) => {
  // Kiểm tra các trường bắt buộc (cho phép để trống các trường link, video intro, social)
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
  // Các trường sau có thể để trống: introVideo, website, twitter, linkedin, youtube, facebook
  // Không kiểm tra bắt buộc các trường này
  if (data.bio && data.bio.length < 50) {
    throw new Error("Bio phải từ 50 ký tự trở lên.");
  }
  if (data.mentorReason && data.mentorReason.length < 20) {
    throw new Error("Lý do làm mentor phải từ 20 ký tự trở lên.");
  }
  try {
    let response;
    // Nếu có avatar (ảnh base64 hoặc file), dùng multipart/form-data
    if (data.avatar) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "skills" && Array.isArray(value)) {
          formData.append(key, value.join(","));
        } else if (key === "links" && typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      console.log(
        "[Profile API] PUT /api/v1/profile/mentor multipart",
        formData
      );
      response = await axios.put("/api/v1/profile/mentor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      console.log("[Profile API] PUT /api/v1/profile/mentor json", data);
      response = await axios.put("/api/v1/profile/mentor", data);
    }
    console.log("[Profile API] response:", response.data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error("[Profile API] Lỗi cập nhật:", error.response.data);
      throw new Error(error.response.data.message || "Lỗi cập nhật profile");
    }
    throw error;
  }
};

// Cập nhật profile mentee
export const updateMenteeProfile = async (data) => {
  try {
    // Chuẩn bị dữ liệu gửi lên server
    const payload = { ...data };

    // Tạo object links từ các trường social media riêng lẻ
    if (data.website || data.twitter || data.linkedin || data.facebook) {
      payload.links = {
        website: data.website || "",
        twitter: data.twitter || "",
        linkedin: data.linkedin || "",
        facebook: data.facebook || "",
      };
      // Xóa các trường individual để không duplicate
      delete payload.website;
      delete payload.twitter;
      delete payload.linkedin;
      delete payload.facebook;
    }

    let response;
    if (data.avatar) {
      const formData = new FormData();

      // Append avatar file first
      if (data.avatar instanceof File) {
        formData.append("avatar", data.avatar);
      }

      // Append other fields
      Object.entries(payload).forEach(([key, value]) => {
        if (key === "avatar") {
          // Skip avatar as it's already appended above
          return;
        } else if (key === "links" && typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      console.log(
        "[Profile API] PUT /api/v1/profile/mentee multipart",
        formData
      );
      response = await axios.put("/api/v1/profile/mentee", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      // Remove avatar field from payload if not uploading
      delete payload.avatar;
      console.log("[Profile API] PUT /api/v1/profile/mentee json", payload);
      response = await axios.put("/api/v1/profile/mentee", payload);
    }
    console.log("[Profile API] response:", response.data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error("[Profile API] Lỗi cập nhật mentee:", error.response.data);
      throw new Error(
        error.response.data.message || "Lỗi cập nhật profile mentee"
      );
    }
    console.error("[Profile API] Network error:", error);
    throw new Error("Lỗi kết nối mạng khi cập nhật profile");
  }
};

// Đổi avatar cho user (mentor hoặc mentee)
export const changeAvatar = async (avatarFile) => {
  try {
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    const response = await axios.put("/api/v1/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách khóa học của mentor
export const getMentorCourses = async (mentorId) => {
  try {
    const response = await axios.get(`/api/course/mentor/${mentorId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const profileApi = {
  getProfile,
  getMentorById,
  getTopMentors,
  updateMentorProfile,
  updateMenteeProfile,
  changeAvatar,
  getMentorCourses,
};

export default profileApi;
