import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    headline: { type: String, default: "" },
    bio: { type: String, default: "" }, //mentor
    skills: { type: [String], default: [] }, //mentor
    experience: { type: String, default: "" }, //mentor
    description: { type: String, default: "" }, //mentee
    goal: { type: String, default: "" }, //mentee
    education: { type: String, default: "" }, //mentee
    languages: { type: [String], default: [] }, //mentor, mentee
    timezone: { type: String, default: "" }, //mentor, mentee
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }], //mentor
    rate: { type: Number, default: 0 }, //mentor
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
