import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  job: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true },
  industry: { type: String, required: true },
  branches: { type: String, required: true },
  social: { type: String, required: true },
  website: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("JoinRequest", joinRequestSchema);
