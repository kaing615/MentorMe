import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Basic Info (moved from User)
    jobTitle: { type: String, default: "" },
    location: { type: String, default: "" },
    category: { type: String, default: "" },
    bio: { type: String, default: "" },

    // Skills & Experience
    skills: { type: [String], default: [] },
    experience: { type: String, default: "" },

    // Mentor specific
    headline: { type: String, default: "" },
    mentorReason: { type: String, default: "" },
    greatestAchievement: { type: String, default: "" },
    introVideo: { type: String, default: "" },

    // Mentee specific
    description: { type: String, default: "" },
    goal: { type: String, default: "" },
    education: { type: String, default: "" },

    // Common
    languages: { type: [String], default: [] },
    timezone: { type: String, default: "" },

    // Business Logic
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    rate: { type: Number, default: 0 },

    // Social Links (consolidated)
    links: {
      website: { type: String, default: "" },
      X: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      youtube: { type: String, default: "" },
      facebook: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Profile", ProfileSchema);
