import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    headline: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experience: { type: String, default: '' },
    description: { type: String, default: '' },
    goal: { type: String, default: '' },
    links: {
        website: { type: String, default: '' },
        X: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        youtube: { type: String, default: '' },
        facebook: { type: String, default: '' },
    },
}); 

export default mongoose.model("Profile", ProfileSchema);