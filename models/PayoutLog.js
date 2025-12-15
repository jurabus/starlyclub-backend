import mongoose from "mongoose";

const payoutLogSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    providerName: String,

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "SR",
    },

    periodStart: Date,
    periodEnd: Date,

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    gateway: {
      type: String,
      enum: ["tap", "bank"],
      default: "tap",
    },

    reference: String,
    errorMessage: String,

    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("PayoutLog", payoutLogSchema);
