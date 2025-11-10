// models/MembershipPlan.js
import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, default: "" },
    // Fraction of provider's maximum discount. e.g., 0.5 for 50%, 1.0 for 100%
    fraction: { type: Number, min: 0, max: 1, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("MembershipPlan", membershipPlanSchema);
