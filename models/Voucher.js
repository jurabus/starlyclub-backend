import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    // 🔗 Provider relationship
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    providerName: { type: String, required: true },
    logoUrl: { type: String, default: "" },

    // 💰 Pricing
    currency: { type: String, default: "SR" },
    faceValue: { type: Number, required: true }, // user-selected (50, 100, 150...)
    price: { type: Number, required: true },     // discounted price
    discountPercent: { type: Number, required: true },

    // 🔐 Voucher owner
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

    // 🎫 Voucher status
    status: { type: String, enum: ["unused", "redeemed", "expired"], default: "unused" },

    // 📅 Timestamps
    purchasedAt: { type: Date, default: Date.now },
    redeemedAt: { type: Date },

    // 🔢 Optional name displayed to user
    name: { type: String, trim: true, default: "" },

    // ⭐ Extra flags (optional)
    isActive: { type: Boolean, default: true },

    // 🧾 QR logic (temporary)
    currentQrCode: { type: String },
    qrIssuedAt: { type: Date },
    qrExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Voucher", voucherSchema);
