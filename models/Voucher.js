// models/Voucher.js
import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    providerName: { type: String, required: true }, // denormalized for quick list rendering
    logoUrl: { type: String, default: "" },          // voucher logo (can reuse provider logo)
    currency: { type: String, default: "SR" },

    // Pricing
    faceValue: { type: Number, required: true },     // e.g. 500
    price: { type: Number, required: true },         // e.g. 450 (discounted)
    stock: { type: Number, default: 0 },             // available quantity

    // Flags
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },

    // Optional: human name; if empty we’ll compute on the fly in controller
    name: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

voucherSchema.virtual("discountPercent").get(function () {
  if (!this.faceValue || !this.price) return 0;
  return Math.round(((this.faceValue - this.price) / this.faceValue) * 100);
});

voucherSchema.set("toJSON", { virtuals: true });
voucherSchema.set("toObject", { virtuals: true });

export default mongoose.model("Voucher", voucherSchema);
