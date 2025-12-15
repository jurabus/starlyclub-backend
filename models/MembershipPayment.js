import mongoose from "mongoose";

const membershipPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },

    gateway: {
      type: String,
      enum: ["tap", "tabby", "tamara"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
cycle: { type: String, enum: ["monthly", "yearly"], required: true },
days: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model(
  "MembershipPayment",
  membershipPaymentSchema
);
