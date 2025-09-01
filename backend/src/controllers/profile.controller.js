import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import responseHandler from "../handlers/response.handler.js";
import User from "../models/user.model.js";
import { uploadImage } from "../utils/cloudinary.js";
import profileUtils from "../utils/profile.utils.js";

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

    // Tìm hoặc tạo Profile bằng utils
    let profile = await profileUtils.findOrCreateProfile(userId);

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

    // Tìm hoặc tạo Profile bằng utils
    let profile = await profileUtils.findOrCreateProfile(userId);

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

    // Sử dụng profileUtils để lấy thông tin đầy đủ
    const profile = await profileUtils.getFullProfile(userId);

    if (!profile) {
      // Nếu profile không tồn tại, tạo mới
      const createdProfile = await profileUtils.findOrCreateProfile(userId);
      const fullProfile = await profileUtils.getFullProfile(userId);

      return responseHandler.ok(res, {
        message: "Profile đã được tạo tự động",
        profile: fullProfile,
      });
    }

    return responseHandler.ok(res, {
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

/**
 * Search mentors by various criteria
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} List of mentors matching search criteria
 */
export const searchMentors = async (req, res) => {
  try {
    const {
      name, // Tìm theo tên (firstName + lastName)
      id, // Tìm theo user ID
      category, // Tìm theo danh mục/môn học
      skills, // Tìm theo kỹ năng (comma separated)
      location, // Tìm theo địa điểm
      page = 1, // Phân trang
      limit = 10, // Số lượng per page
    } = req.query;

    // Build search query
    let userQuery = { role: { $in: ["mentor"] } }; // Chỉ tìm mentor
    let profileQuery = {};

    // Search by ID (exact match)
    if (id) {
      try {
        userQuery._id = new mongoose.Types.ObjectId(id);
      } catch (error) {
        return responseHandler.badRequest(res, "Invalid user ID format");
      }
    }

    // Search by name (case insensitive, partial match)
    if (name) {
      const nameRegex = new RegExp(name.trim(), "i");
      userQuery.$or = [
        { firstName: nameRegex },
        { lastName: nameRegex },
        // Search full name
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: nameRegex,
            },
          },
        },
      ];
    }

    // Search by category
    if (category) {
      profileQuery.category = new RegExp(category.trim(), "i");
    }

    // Search by skills
    if (skills) {
      const skillArray = skills.split(",").map((skill) => skill.trim());
      profileQuery.skills = {
        $in: skillArray.map((skill) => new RegExp(skill, "i")),
      };
    }

    // Search by location
    if (location) {
      profileQuery.location = new RegExp(location.trim(), "i");
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search with aggregation
    const mentors = await User.aggregate([
      // Match users (mentors)
      { $match: userQuery },

      // Lookup profile data
      {
        $lookup: {
          from: "profiles",
          localField: "_id",
          foreignField: "user",
          as: "profile",
        },
      },

      // Unwind profile (should be only one)
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

      // Match profile criteria
      ...(Object.keys(profileQuery).length > 0
        ? [
            {
              $match: {
                ...Object.entries(profileQuery).reduce((acc, [key, value]) => {
                  acc[`profile.${key}`] = value;
                  return acc;
                }, {}),
              },
            },
          ]
        : []),

      // Lookup courses taught by mentor
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "mentor",
          as: "courses",
        },
      },

      // Add computed fields
      {
        $addFields: {
          coursesCount: { $size: "$courses" },
          subjects: { $setUnion: ["$courses.category", []] },
        },
      },

      // Clean up sensitive data
      {
        $project: {
          password: 0,
          salt: 0,
          verifyKey: 0,
          resetToken: 0,
          resetTokenExpires: 0,
          "courses.mentor": 0, // Remove mentor reference from courses to avoid circular
        },
      },

      // Sort by rating, then by name
      {
        $sort: {
          "profile.rate": -1,
          firstName: 1,
          lastName: 1,
        },
      },

      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Get total count for pagination
    const totalCountPipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: "profiles",
          localField: "_id",
          foreignField: "user",
          as: "profile",
        },
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
      ...(Object.keys(profileQuery).length > 0
        ? [
            {
              $match: {
                ...Object.entries(profileQuery).reduce((acc, [key, value]) => {
                  acc[`profile.${key}`] = value;
                  return acc;
                }, {}),
              },
            },
          ]
        : []),
      { $count: "total" },
    ];

    const totalCountResult = await User.aggregate(totalCountPipeline);
    const totalCount =
      totalCountResult.length > 0 ? totalCountResult[0].total : 0;

    // Response with pagination info
    return responseHandler.ok(res, {
      mentors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
        hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
      searchCriteria: { name, id, category, skills, location },
    });
  } catch (error) {
    console.error("Error searching mentors:", error);
    return responseHandler.error(
      res,
      "Lỗi khi tìm kiếm mentor: " + error.message
    );
  }
};

export default {
  updateMentorProfile,
  updateMenteeProfile,
  getProfile,
  changeAvatar,
  searchMentors,
};