import Profile from "../models/profile.model.js";

/**
 * Tìm hoặc tạo profile cho user
 * @param {String} userId - ID của user
 * @returns {Object} profile - Profile object
 */
const findOrCreateProfile = async (userId) => {
  try {
    let profile = await Profile.findOne({ user: userId });

    if (!profile) {
      profile = new Profile({
        user: userId,
        // Default values
        jobTitle: "",
        location: "",
        category: "",
        bio: "",
        skills: [],
        experience: "",
        headline: "",
        mentorReason: "",
        greatestAchievement: "",
        introVideo: "",
        description: "",
        goal: "",
        education: "",
        languages: [],
        timezone: "",
        reviews: [],
        rate: 0,
        links: {
          website: "",
          X: "",
          linkedin: "",
          github: "",
          youtube: "",
          facebook: "",
        },
      });

      await profile.save();
    }

    return profile;
  } catch (error) {
    console.error("Error in findOrCreateProfile:", error);
    throw error;
  }
};

/**
 * Tạo profile cho user mới với dữ liệu cụ thể
 * @param {String} userId - ID của user
 * @param {Object} profileData - Dữ liệu profile
 * @param {String} userRole - Role của user (mentor/mentee)
 * @returns {Object} profile - Profile object được tạo
 */
const createProfileForNewUser = async (
  userId,
  profileData = {},
  userRole = "mentee"
) => {
  try {
    const defaultProfile = {
      user: userId,
      jobTitle: profileData.jobTitle || "",
      location: profileData.location || "",
      category: profileData.category || "",
      bio: profileData.bio || "",
      skills: Array.isArray(profileData.skills)
        ? profileData.skills
        : typeof profileData.skills === "string"
        ? profileData.skills.split(",").map((s) => s.trim())
        : [],
      experience: profileData.experience || "",
      languages: profileData.languages || [],
      timezone: profileData.timezone || "",
      links: {
        website: profileData.links?.website || "",
        X: profileData.links?.X || "",
        linkedin: profileData.links?.linkedin || "",
        github: profileData.links?.github || "",
        youtube: profileData.links?.youtube || "",
        facebook: profileData.links?.facebook || "",
      },
    };

    // Thêm fields cụ thể cho mentor
    if (userRole === "mentor") {
      defaultProfile.headline = profileData.headline || "";
      defaultProfile.mentorReason = profileData.mentorReason || "";
      defaultProfile.greatestAchievement =
        profileData.greatestAchievement || "";
      defaultProfile.introVideo = profileData.introVideo || "";
    }

    // Thêm fields cụ thể cho mentee
    if (userRole === "mentee") {
      defaultProfile.description = profileData.description || "";
      defaultProfile.goal = profileData.goal || "";
      defaultProfile.education = profileData.education || "";
    }

    const profile = new Profile(defaultProfile);
    await profile.save();

    return profile;
  } catch (error) {
    console.error("Error in createProfileForNewUser:", error);
    throw error;
  }
};

/**
 * Lấy profile đầy đủ của user với populate
 * @param {String} userId - ID của user
 * @returns {Object} profile - Profile object với thông tin đầy đủ
 */
const getFullProfile = async (userId) => {
  try {
    const profile = await Profile.findOne({ user: userId })
      .populate({
        path: "user",
        select: "userName firstName lastName email avatarUrl role createdAt",
      })
      .populate({
        path: "reviews",
        populate: {
          path: "author",
          select: "firstName lastName avatarUrl",
        },
        options: {
          sort: { createdAt: -1 }, // Reviews mới nhất trước
          limit: 10, // Giới hạn 10 reviews gần nhất
        },
      });

    return profile;
  } catch (error) {
    console.error("Error in getFullProfile:", error);
    // Nếu populate reviews lỗi, thử get profile không reviews
    try {
      const profileWithoutReviews = await Profile.findOne({
        user: userId,
      }).populate({
        path: "user",
        select: "userName firstName lastName email avatarUrl role createdAt",
      });
      console.warn("Fallback: Profile loaded without reviews");
      return profileWithoutReviews;
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      throw error;
    }
  }
};

export default {
  findOrCreateProfile,
  createProfileForNewUser,
  getFullProfile,
};
