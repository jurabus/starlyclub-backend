import mongoose from "mongoose";

const providerEarningSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    gateway: {
      type: String,
      enum: ["tabby", "tamara"],
      required: true,
    },

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("ProviderEarning", providerEarningSchema);
