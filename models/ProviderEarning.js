import mongoose from "mongoose";

const providerEarningSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "SR",
    },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    earnedAt: {
      type: Date,
      default: Date.now,
    },

    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("ProviderEarning", providerEarningSchema);
