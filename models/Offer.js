// models/Offer.js
import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    // Optional external link
    externalLink: { type: String, default: "" },

    // Up to 4 images
    images: { type: [String], default: [] },

    // Single optional video
    video: { type: String, default: "" },

    // View counter
    views: { type: Number, default: 0 },

    // Created by Admin (no provider linkage)
    createdBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
