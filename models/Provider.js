import mongoose from "mongoose";

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: String,
  description: String,
  category: String,
  rating: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  username: { type: String, unique: true, required: true },
  accessKey: { type: String, required: true },
});

export default mongoose.model("Provider", providerSchema);
