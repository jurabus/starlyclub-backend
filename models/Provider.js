// models/Provider.js
import mongoose from "mongoose";

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: String,
  description: String,
  category: String,
  area: { type: String, default: "Cairo" },
  rating: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  username: { type: String, unique: true, required: true },
  accessKey: { type: String, required: true },

  // Existing membership / scan-related fields
  // 🔹 PAYMENT (Tap Sub-Merchant)
tapPayoutEnabled: { type: Boolean, default: false },
// 🔐 Payment onboarding (Tap sub-merchant)
tapSubMerchantId: {
  type: String,
  default: "",
},

tapOnboardingStatus: {
  type: String,
  enum: ["not_started", "pending", "verified"],
  default: "not_started",
},
// 🔐 Tamara onboarding
tamaraMerchantId: {
  type: String,
  default: "",
},

tamaraOnboardingStatus: {
  type: String,
  enum: ["not_started", "pending", "verified"],
  default: "not_started",
},

// Optional (for admin dashboard)
iban: { type: String, default: "" },
bankName: { type: String, default: "" },
  maximumDiscount: { type: Number, default: 0, min: 0, max: 100 }, // provider's max discount %
  scannedCardsCount: { type: Number, default: 0 },                  // total successful membership scans
  scanHistory: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      membershipType: String, // plan name
      discountPercent: Number,
      scannedAt: { type: Date, default: Date.now },
    },
  ],

  // 🔹 NEW: Voucher discount percentage (for wallet-based dynamic vouchers)
  // If 0 or null → provider does NOT offer vouchers
  voucherDiscountPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

minimumVoucherAmount: {
  type: Number,
  min: 0,
  default: 0, // 0 means user should see increments of 50
},

});

export default mongoose.model("Provider", providerSchema);
