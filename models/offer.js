import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  discountPercent: Number,
  category: String,
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Offer", offerSchema);
