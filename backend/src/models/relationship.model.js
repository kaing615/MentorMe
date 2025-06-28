import mongoose from "mongoose";

const RelationshipSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notes: String,
});

export default mongoose.model("Relationship", RelationshipSchema);
