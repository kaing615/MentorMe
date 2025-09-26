import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import responseHandler from "../handlers/response.handler.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import { uploadImage } from "../utils/cloudinary.js";
import profileUtils from "../utils/profile.utils.js";

const sanitizeUser = (userDoc) => {
  const obj = userDoc?.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  delete obj.salt;
  delete obj.verifyKey;
  delete obj.resetToken;
  delete obj.resetTokenExpires;
  return obj;
};

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

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
      return responseHandler.forbidden(
        res,
        "Chỉ mentor mới có thể cập nhật thông tin này"
      );
    }

    let avatarUrl = user.avatarUrl;
    let avatarPublicId = user.avatarPublicId;

    if (req.file) {
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }
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

    const skillsArray = parseArrayish(skills);
    const languagesArray = parseArrayish(languages);

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

    // Only update user fields if they are provided
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
    if (skillsArray?.length >= 0) user.skills = skillsArray;
    if (mentorReason !== undefined) user.mentorReason = mentorReason;
    if (greatestAchievement !== undefined)
      user.greatestAchievement = greatestAchievement;

    // Only update profile fields if they are provided
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
    return responseHandler.error(
      res,
      err.message || "Lỗi cập nhật thông tin mentor!"
    );
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
      return responseHandler.forbidden(
        res,
        "Chỉ mentee mới có thể cập nhật thông tin này"
      );
    }

    let avatarUrl = user.avatarUrl;
    let avatarPublicId = user.avatarPublicId;
    if (req.file) {
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }
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

    // Prepare update object - only include fields that are provided
    const updateFields = {};
    if (userName !== undefined) updateFields.userName = userName;
    if (firstName !== undefined) updateFields.firstName = capitalize(firstName);
    if (lastName !== undefined) updateFields.lastName = capitalize(lastName);
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
    if (avatarPublicId !== undefined)
      updateFields.avatarPublicId = avatarPublicId;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    });

    // Tìm hoặc tạo Profile bằng utils
    let profile = await profileUtils.findOrCreateProfile(userId);
    if (!profile) profile = new Profile({ user: userId });

    // Only update profile fields if they are provided
    if (bio !== undefined) profile.bio = bio;
    if (location !== undefined) profile.location = location;
    if (description !== undefined) profile.description = description;
    if (goal !== undefined) profile.goal = goal;
    if (education !== undefined) profile.education = education;
    if (languages !== undefined) profile.languages = parseArrayish(languages);
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
    return responseHandler.error(
      res,
      err.message || "Lỗi cập nhật thông tin mentee!"
    );
  }
};

export const getMentorById = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId)
      return responseHandler.badRequest(res, "Mentor ID là bắt buộc");

    const user = await User.findById(mentorId);
    if (!user) return responseHandler.badRequest(res, "Mentor không tồn tại");
    if (user.role !== "mentor")
      return responseHandler.badRequest(res, "User này không phải là mentor");

    let profile = await Profile.findOne({ user: mentorId });

    // Nếu chưa có profile, tạo mới với dữ liệu từ User
    if (!profile) {
      profile = new Profile({
        user: mentorId,
        jobTitle: user.jobTitle || "",
        location: user.location || "",
        category: user.category || "",
        bio: user.bio || "",
        skills: user.skills || [],
        mentorReason: user.mentorReason || "",
        greatestAchievement: user.greatestAchievement || "",
        introVideo: user.introVideo || "",
        links: {
          linkedin: user.linkedinUrl || "",
        },
      });
      await profile.save();
    }

    // Tạo merged profile data ưu tiên Profile trước, User làm fallback
    const mergedProfile = {
      // Basic user info từ User model
      _id: user._id,
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      avatarPublicId: user.avatarPublicId,
      isVerified: user.isVerified,

      // Profile data ưu tiên Profile model, fallback về User model
      jobTitle: profile.jobTitle || user.jobTitle || "",
      location: profile.location || user.location || "",
      category: profile.category || user.category || "",
      bio: profile.bio || user.bio || "",
      skills:
        profile.skills && profile.skills.length > 0
          ? profile.skills
          : user.skills || [],
      experience: profile.experience || "",

      // Mentor specific
      headline: profile.headline || "",
      mentorReason: profile.mentorReason || user.mentorReason || "",
      greatestAchievement:
        profile.greatestAchievement || user.greatestAchievement || "",
      introVideo: profile.introVideo || user.introVideo || "",

      // Mentee specific
      description: profile.description || "",
      goal: profile.goal || "",
      education: profile.education || "",

      // Common
      languages: profile.languages || [],
      timezone: profile.timezone || "",

      // Social Links
      links: {
        website: profile.links?.website || "",
        twitter: profile.links?.twitter || "",
        linkedin: profile.links?.linkedin || user.linkedinUrl || "",
        github: profile.links?.github || "",
        youtube: profile.links?.youtube || "",
        facebook: profile.links?.facebook || "",
      },

      // Business Logic
      reviews: profile.reviews || [],
      rate: profile.rate || 0,

      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    // Calculate total unique students from all courses taught by this mentor
    let totalMentees = 0;
    try {
      const mentorCourses = await Course.find({ mentor: mentorId }).lean();
      const uniqueMentees = new Set();

      mentorCourses.forEach((course) => {
        if (course.mentees && Array.isArray(course.mentees)) {
          course.mentees.forEach((menteeId) => {
            uniqueMentees.add(menteeId.toString());
          });
        }
      });

      totalMentees = uniqueMentees.size;
    } catch (courseErr) {
      console.warn("Error calculating total mentees:", courseErr);
      totalMentees = 0;
    }

    return responseHandler.ok(res, {
      profile: mergedProfile,
      user: { ...sanitizeUser(user), experience: mergedProfile.experience }, // Đảm bảo user cũng có trường experience
      totalMentees: totalMentees,
    });
  } catch (err) {
    console.error("Lỗi lấy thông tin mentor:", err);
    return responseHandler.error(res, "Lỗi lấy thông tin mentor!");
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = getAuthedUserId(req);
    if (!userId) return responseHandler.unauthorized(res, "Unauthorized");

    const user = await User.findById(userId);
    if (!user) return responseHandler.badRequest(res, "User không tồn tại");

    let profile = await Profile.findOne({ user: userId });

    // Nếu chưa có profile, tạo mới với dữ liệu từ User
    if (!profile) {
      profile = new Profile({
        user: userId,
        jobTitle: user.jobTitle || "",
        location: user.location || "",
        category: user.category || "",
        bio: user.bio || "",
        skills: user.skills || [],
        mentorReason: user.mentorReason || "",
        greatestAchievement: user.greatestAchievement || "",
        introVideo: user.introVideo || "",
        links: {
          linkedin: user.linkedinUrl || "",
        },
      });
      await profile.save();
    }

    // Tạo merged profile data ưu tiên Profile trước, User làm fallback
    const mergedProfile = {
      // Basic user info từ User model
      _id: user._id,
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      avatarPublicId: user.avatarPublicId,
      isVerified: user.isVerified,

      // Profile data ưu tiên Profile model, fallback về User model
      jobTitle: profile.jobTitle || user.jobTitle || "",
      location: profile.location || user.location || "",
      category: profile.category || user.category || "",
      bio: profile.bio || user.bio || "",
      skills:
        profile.skills && profile.skills.length > 0
          ? profile.skills
          : user.skills || [],
      experience: profile.experience || "",

      // Mentor specific
      headline: profile.headline || "",
      mentorReason: profile.mentorReason || user.mentorReason || "",
      greatestAchievement:
        profile.greatestAchievement || user.greatestAchievement || "",
      introVideo: profile.introVideo || user.introVideo || "",

      // Mentee specific
      description: profile.description || "",
      goal: profile.goal || "",
      education: profile.education || "",

      // Common
      languages: profile.languages || [],
      timezone: profile.timezone || "",

      // Social Links
      links: {
        website: profile.links?.website || "",
        twitter: profile.links?.twitter || "",
        linkedin: profile.links?.linkedin || user.linkedinUrl || "",
        github: profile.links?.github || "",
        youtube: profile.links?.youtube || "",
        facebook: profile.links?.facebook || "",
      },

      // Business Logic
      reviews: profile.reviews || [],
      rate: profile.rate || 0,

      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    return responseHandler.ok(res, {
      profile: mergedProfile,
      user: { ...sanitizeUser(user), experience: mergedProfile.experience }, // Đảm bảo user cũng có trường experience
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
    if (!req.file)
      return responseHandler.badRequest(res, "Chưa có file avatar gửi lên!");

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
    return responseHandler.error(res, "Đổi avatar thất bại!");
  }
};

export const getTopMentors = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    // Tìm tất cả mentors có role = "mentor" và isVerified = true
    const mentors = await User.find({
      role: "mentor",
      isVerified: true,
    })
      .select("_id firstName lastName jobTitle category avatarUrl bio")
      .limit(parseInt(limit))
      .lean();

    // Lấy thông tin profile cho mỗi mentor
    const mentorsWithProfile = await Promise.all(
      mentors.map(async (mentor) => {
        let profile = await Profile.findOne({ user: mentor._id }).lean();

        return {
          _id: mentor._id,
          firstName: mentor.firstName || "",
          lastName: mentor.lastName || "",
          fullName: `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim(),
          jobTitle: profile?.jobTitle || mentor.jobTitle || "",
          category: profile?.category || mentor.category || "",
          avatarUrl: mentor.avatarUrl || "",
          bio: profile?.bio || mentor.bio || "",
          // Placeholder data cho rating và students (có thể tính từ courses sau)
          averageRating: 4.5 + Math.random() * 0.5, // Mock data 4.5-5.0
          totalStudents: Math.floor(Math.random() * 3000) + 500, // Mock data 500-3500
        };
      })
    );

    return responseHandler.ok(res, {
      mentors: mentorsWithProfile,
      total: mentorsWithProfile.length,
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách top mentors:", err);
    return responseHandler.error(res, "Lỗi lấy danh sách top mentors!");
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
  getMentorById,
  getTopMentors,
  changeAvatar,
  searchMentors,
};
