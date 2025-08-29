import { v2 as cloudinary } from "cloudinary";
import responseHandler from "../handlers/response.handler.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import { uploadImage } from "../utils/cloudinary.js";

const sanitizeUser = (userDoc) => {
  const obj = userDoc?.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  delete obj.salt;
  delete obj.verifyKey;
  delete obj.resetToken;
  delete obj.resetTokenExpires;
  return obj;
};

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

const parseArrayish = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // fallthrough
      }
    }
    return trimmed
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
};

// Lấy userId an toàn từ middleware (hỗ trợ nhiều tên field khác nhau)
const getAuthedUserId = (req) =>
  req?.user?.id || req?.user?._id?.toString?.() || req?.user?.userId || null;

export const updateMentorProfile = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return responseHandler.unauthorized(res, "Unauthorized");

    const {
      userName,
      firstName,
      lastName,
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

    const user = await User.findById(userId);
    if (!user) return responseHandler.badRequest(res, "User không tồn tại");
    if (user.role !== "mentor") {
      return responseHandler.forbidden(res, "Chỉ mentor mới có thể cập nhật thông tin này");
    }

    let avatarUrl = user.avatarUrl;
    let avatarPublicId = user.avatarPublicId;

    if (req.file) {
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await uploadImage(base64, {
        public_id: `avatar_mentor_${userId}_${Date.now()}`,
        folder: "user_avatars",
        overwrite: true,
      });
      avatarUrl = result.secure_url;
      avatarPublicId = result.public_id;
    }

    const skillsArray = parseArrayish(skills);
    const languagesArray = parseArrayish(languages);

    let profile = await Profile.findOne({ user: userId });
    if (!profile) profile = new Profile({ user: userId });

    if (userName !== undefined) user.userName = userName;
    if (firstName !== undefined) user.firstName = capitalize(firstName);
    if (lastName !== undefined) user.lastName = capitalize(lastName);
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (avatarPublicId !== undefined) user.avatarPublicId = avatarPublicId;
    if (bio !== undefined) user.bio = bio;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (location !== undefined) user.location = location;
    if (category !== undefined) user.category = category;
    if (headline !== undefined) user.headline = headline;
    if (introVideo !== undefined) user.introVideo = introVideo;
    if (skillsArray?.length) user.skills = skillsArray;

    if (jobTitle !== undefined) profile.jobTitle = jobTitle;
    if (location !== undefined) profile.location = location;
    if (category !== undefined) profile.category = category;
    if (skillsArray !== undefined) profile.skills = skillsArray;
    if (bio !== undefined) profile.bio = bio;
    if (mentorReason !== undefined) profile.mentorReason = mentorReason;
    if (greatestAchievement !== undefined) profile.greatestAchievement = greatestAchievement;
    if (headline !== undefined) profile.headline = headline;
    if (experience !== undefined) profile.experience = experience;
    if (introVideo !== undefined) profile.introVideo = introVideo;
    if (languagesArray !== undefined) profile.languages = languagesArray;
    if (timezone !== undefined) profile.timezone = timezone;

    if (links && Object.keys(links).length > 0) {
      profile.links = { ...(profile.links || {}), ...links };
    }

    await user.save();
    await profile.save();

    return responseHandler.ok(res, {
      message: "Cập nhật thông tin mentor thành công!",
      user: sanitizeUser(user),
      profile,
    });
  } catch (err) {
    console.error("Lỗi cập nhật thông tin mentor:", err);
    return responseHandler.error(res, err.message || "Lỗi cập nhật thông tin mentor!");
  }
};

export const updateMenteeProfile = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return responseHandler.unauthorized(res, "Unauthorized");

    const {
      userName,
      firstName,
      lastName,
      bio,
      location,
      description,
      goal,
      education,
      languages,
      timezone,
      links = {},
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return responseHandler.badRequest(res, "User không tồn tại");
    if (user.role !== "mentee") {
      return responseHandler.forbidden(res, "Chỉ mentee mới có thể cập nhật thông tin này");
    }

    let avatarUrl = user.avatarUrl;
    let avatarPublicId = user.avatarPublicId;
    if (req.file) {
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await uploadImage(base64, {
        public_id: `avatar_mentee_${userId}_${Date.now()}`,
        folder: "user_avatars",
        overwrite: true,
      });
      avatarUrl = result.secure_url;
      avatarPublicId = result.public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        userName,
        firstName: firstName !== undefined ? capitalize(firstName) : undefined,
        lastName: lastName !== undefined ? capitalize(lastName) : undefined,
        avatarUrl,
        avatarPublicId,
        bio,
        location,
      },
      { new: true, runValidators: true }
    );

    let profile = await Profile.findOne({ user: userId });
    if (!profile) profile = new Profile({ user: userId });

    if (bio !== undefined) profile.bio = bio;
    if (location !== undefined) profile.location = location;
    if (description !== undefined) profile.description = description;
    if (goal !== undefined) profile.goal = goal;
    if (education !== undefined) profile.education = education;
    const languagesArray = parseArrayish(languages);
    if (languages !== undefined) profile.languages = languagesArray;
    if (timezone !== undefined) profile.timezone = timezone;

    if (links && Object.keys(links).length > 0) {
      profile.links = { ...(profile.links || {}), ...links };
    }

    await profile.save();

    return responseHandler.ok(res, {
      message: "Cập nhật thông tin mentee thành công!",
      user: sanitizeUser(updatedUser),
      profile,
    });
  } catch (err) {
    console.error("Lỗi cập nhật thông tin mentee:", err);
    return responseHandler.error(res, err.message || "Lỗi cập nhật thông tin mentee!");
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return responseHandler.unauthorized(res, "Unauthorized");

    const user = await User.findById(userId);
    if (!user) return responseHandler.badRequest(res, "User không tồn tại");

    const profile = await Profile.findOne({ user: userId });

    return responseHandler.ok(res, {
      user: sanitizeUser(user),
      profile,
    });
  } catch (err) {
    console.error("Lỗi lấy thông tin profile:", err);
    return responseHandler.error(res, "Lỗi lấy thông tin profile!");
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return responseHandler.unauthorized(res, "Unauthorized");

    const user = await User.findById(userId);
    if (!user) return responseHandler.badRequest(res, "User không tồn tại");
    if (!req.file) return responseHandler.badRequest(res, "Chưa có file avatar gửi lên!");

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
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
    return responseHandler.error(res, "Đổi avatar thất bại!");
  }
};

export default {
  updateMentorProfile,
  updateMenteeProfile,
  getProfile,
  changeAvatar,
};