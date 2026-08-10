import createPrivateClient from "../clients/private.client.js";

const privateClient = createPrivateClient();

// Lấy profile hiện tại (mentor hoặc mentee, tự động phân loại)
export const getProfile = async () => {
  return privateClient.get("/profile");
};

// Lấy thông tin mentor theo ID (public API, không cần token)
export const getMentorById = async (mentorId) => {
  return privateClient.get(`/profile/mentor/${mentorId}`);
};

// Lấy danh sách top mentors (public API, không cần token)
export const getTopMentors = async (limit = 6) => {
  return privateClient.get("/profile/top-mentors", { params: { limit } });
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

// Cập nhật profile mentee
export const updateMenteeProfile = async (data) => {
  try {
    // Chuẩn bị dữ liệu gửi lên server
    const payload = { ...data };

    // Tạo object links từ các trường social media riêng lẻ
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
          formData.append(key, value as string | Blob);
        }
      });

      response = await privateClient.put("/profile/mentee", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      // Remove avatar field from payload if not uploading
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

// Đổi avatar cho user (mentor hoặc mentee)
export const changeAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);
  return privateClient.put("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Lấy danh sách khóa học của mentor
export const getMentorCourses = async (mentorId) => {
  return privateClient.get(`/course/mentor/${mentorId}`);
};

const profileApi: any = {
  getProfile,
  getMentorById,
  getTopMentors,
  updateMentorProfile,
  updateMenteeProfile,
  changeAvatar,
  getMentorCourses,
};

export default profileApi;
