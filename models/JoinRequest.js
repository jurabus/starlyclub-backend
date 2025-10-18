import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    name: String,
    jobTitle: String,
    email: String,
    mobile: String,
    company: String,
    industry: String,
    branches: String,
    socialUrl: String,
    platform: String,
    website: String,
  },
  { timestamps: true }
);

export default mongoose.model("JoinRequest", joinRequestSchema);
