import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    description: String,
    imageUrl: String,
    discountPercent: Number,
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },

    // ✅ Permanent offer code for reference (seeded)
    offerCode: String,

    // ✅ One-time QR issue details
    currentQrCode: String,      // temporary QR string / URL
    qrExpiresAt: Date,          // expiration timestamp
    isRedeemed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
