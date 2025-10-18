import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  countryCode: { type: String, default: "+966" },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  branches: { type: String, required: true },
  socialUrl: { type: String, required: true },
  platform: { type: String, default: "Facebook" },
  website: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model("JoinRequest", joinRequestSchema);
