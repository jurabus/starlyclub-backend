// models/UserMembership.js
import mongoose from "mongoose";

const userMembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true, required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cardCode: { type: String, index: true }, // optional human-readable code on the card
    isActive: { type: Boolean, default: true }, // kept for quick filtering; validated against dates
    lastScanAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Keep isActive in sync when loading docs
userMembershipSchema.methods.isCurrentlyValid = function () {
  const now = new Date();
  return this.isActive && this.startDate <= now && now <= this.endDate;
};

export default mongoose.model("UserMembership", userMembershipSchema);
