import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },           
  type: { type: String, enum: ['percent', 'amount'], required: true },
  value: { type: Number, required: true },                       
  minOrder: { type: Number, default: 0 },                          
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  quantity: { type: Number, default: 1 },                         
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("Discount", DiscountSchema);
