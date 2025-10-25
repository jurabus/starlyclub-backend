import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  countryCode: { type: String, default: "+20" },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  companyName: { type: String, required: true },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("JoinRequest", joinRequestSchema);
