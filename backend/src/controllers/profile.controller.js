import { v2 as cloudinary } from "cloudinary";
import responseHandler from "../handlers/response.handler.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import { uploadImage } from "../utils/cloudinary.js";

export const updateMentorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Phân tách data cho User và Profile
    const {
      // User Model fields (authentication + basic)
      userName,
      firstName,
      lastName,
      // Profile Model fields (business logic)
      jobTitle,
      location,
      category,
      skills,
      bio,
      mentorReason,
      greatestAchievement,
      headline,
      experience,
      introVideo,
      languages,
      timezone,
      links = {},
    } = req.body;

    // Tìm user và kiểm tra role mentor
    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.badRequest(res, "User không tồn tại");
    }

    if (!user.role.includes("mentor")) {
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể cập nhật thông tin này"
      );
    }

    // Xử lý avatar nếu có upload
    let avatarUrl = user.avatarUrl;
    let avatarPublicId = user.avatarPublicId;

    if (req.file) {
      // Xóa avatar cũ nếu có
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }

      // Upload avatar mới
      const base64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await uploadImage(base64, {
        public_id: `avatar_mentor_${userId}_${Date.now()}`,
        folder: "user_avatars",
        overwrite: true,
      });

      avatarUrl = result.secure_url;
      avatarPublicId = result.public_id;
    }

    // Xử lý skills array
    let skillsArray = skills;
    if (typeof skills === "string") {
      skillsArray = skills.split(",").map((skill) => skill.trim());
    }

    // Cập nhật User Model (only authentication + basic info)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        userName,
        firstName,
        lastName,
        avatarUrl,
        avatarPublicId,
      },
      { new: true, runValidators: true }
    );

    // Tìm hoặc tạo Profile
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = new Profile({ user: userId });
    }

    // Cập nhật Profile Model (all business logic)
    if (jobTitle !== undefined) profile.jobTitle = jobTitle;
    if (location !== undefined) profile.location = location;
    if (category !== undefined) profile.category = category;
    if (skillsArray !== undefined) profile.skills = skillsArray;
    if (bio !== undefined) profile.bio = bio;
    if (mentorReason !== undefined) profile.mentorReason = mentorReason;
    if (greatestAchievement !== undefined)
      profile.greatestAchievement = greatestAchievement;
    if (headline !== undefined) profile.headline = headline;
    if (experience !== undefined) profile.experience = experience;
    if (introVideo !== undefined) profile.introVideo = introVideo;
    if (languages !== undefined) profile.languages = languages;
    if (timezone !== undefined) profile.timezone = timezone;

    // Cập nhật links object
    if (links && Object.keys(links).length > 0) {
      profile.links = { ...profile.links, ...links };
    }

    await profile.save();

    // Làm sạch dữ liệu trả về
    const userData = updatedUser.toObject();
    delete userData.password;
    delete userData.salt;
    delete userData.verifyKey;
    delete userData.resetToken;
    delete userData.resetTokenExpires;

    return responseHandler.ok(res, {
      message: "Cập nhật thông tin mentor thành công!",
      user: userData,
      profile: profile,
    });
  } catch (err) {
    console.error("Lỗi cập nhật thông tin mentor:", err);
    responseHandler.error(res, err.message || "Lỗi cập nhật thông tin mentor!");
  }
};

export const updateMenteeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      // User Model fields (authentication + basic)
      userName,
      firstName,
      lastName,
      // Profile Model fields cho mentee
      bio,
      location,
      description,
      goal,
      education,
      languages,
      timezone,
      links = {},
    } = req.body;

    // Tìm user và kiểm tra role mentee
    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.badRequest(res, "User không tồn tại");
    }

    if (!user.role.includes("mentee")) {
      return responseHandler.forbidden(
        res,
        "Chỉ mentee mới có thể cập nhật thông tin này"
      );
    }

    // Xử lý avatar nếu có upload
    let avatarUrl = user.avatarUrl;
    let avatarPublicId = user.avatarPublicId;

    if (req.file) {
      // Xóa avatar cũ nếu có
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }

      // Upload avatar mới
      const base64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await uploadImage(base64, {
        public_id: `avatar_mentee_${userId}_${Date.now()}`,
        folder: "user_avatars",
        overwrite: true,
      });

      avatarUrl = result.secure_url;
      avatarPublicId = result.public_id;
    }

    // Cập nhật User Model (only authentication + basic info)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        userName,
        firstName,
        lastName,
        avatarUrl,
        avatarPublicId,
      },
      { new: true, runValidators: true }
    );

    // Tìm hoặc tạo Profile
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = new Profile({ user: userId });
    }

    // Cập nhật Profile Model (fields cho mentee)
    if (bio !== undefined) profile.bio = bio;
    if (location !== undefined) profile.location = location;
    if (description !== undefined) profile.description = description;
    if (goal !== undefined) profile.goal = goal;
    if (education !== undefined) profile.education = education;
    if (languages !== undefined) profile.languages = languages;
    if (timezone !== undefined) profile.timezone = timezone;

    // Cập nhật links
    if (links && Object.keys(links).length > 0) {
      profile.links = { ...profile.links, ...links };
    }

    await profile.save();

    // Làm sạch dữ liệu trả về
    const userData = updatedUser.toObject();
    delete userData.password;
    delete userData.salt;
    delete userData.verifyKey;
    delete userData.resetToken;
    delete userData.resetTokenExpires;

    return responseHandler.ok(res, {
      message: "Cập nhật thông tin mentee thành công!",
      user: userData,
      profile: profile,
    });
  } catch (err) {
    console.error("Lỗi cập nhật thông tin mentee:", err);
    responseHandler.error(res, err.message || "Lỗi cập nhật thông tin mentee!");
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return responseHandler.badRequest(res, "User không tồn tại");
    }

    // Lấy thông tin profile
    const profile = await Profile.findOne({ user: userId });

    // Làm sạch dữ liệu trả về
    const userData = user.toObject();
    delete userData.password;
    delete userData.salt;
    delete userData.verifyKey;
    delete userData.resetToken;
    delete userData.resetTokenExpires;

    return responseHandler.ok(res, {
      user: userData,
      profile: profile,
    });
  } catch (err) {
    console.error("Lỗi lấy thông tin profile:", err);
    responseHandler.error(res, "Lỗi lấy thông tin profile!");
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return responseHandler.badRequest(res, "User không tồn tại");

    if (!req.file) {
      return responseHandler.badRequest(res, "Chưa có file avatar gửi lên!");
    }

    // Xóa avatar cũ nếu có
    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;
    const result = await uploadImage(base64, {
      public_id: `avatar_${userId}_${Date.now()}`,
      folder: "user_avatars",
      overwrite: true,
    });

    user.avatarUrl = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    return responseHandler.ok(res, {
      message: "Đổi avatar thành công!",
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error("Lỗi đổi avatar:", err);
    responseHandler.error(res, "Đổi avatar thất bại!");
  }
};

export default {
  updateMentorProfile,
  updateMenteeProfile,
  getProfile,
  changeAvatar,
};
