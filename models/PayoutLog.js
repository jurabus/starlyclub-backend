import mongoose from "mongoose";

const payoutLogSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },

    providerName: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    gateway: {
      type: String,
      enum: ["tabby", "tamara", "manual"],
      required: true,
    },

    status: {
      type: String,
      enum: ["paid", "failed"],
      required: true,
    },

    periodStart: Date,
    periodEnd: Date,

    earningsCount: Number,

    reference: String,
    errorMessage: String,
  },
  { timestamps: true }
);

export default mongoose.model("PayoutLog", payoutLogSchema);
