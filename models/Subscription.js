import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    planId: mongoose.Schema.Types.ObjectId,

    amountCents: Number,

    currency: {
      type: String,
      default: "EGP",
    },

    cardToken: {
      type: String,
      required: true, // 🔴 subscriptions are card-only
    },

    cardLast4: String,
    cardType: String,

    pendingPlanId: mongoose.Schema.Types.ObjectId,
    pendingAmountCents: Number,

    currentCycle: {
      type: Number,
      default: 1,
    },

    nextBillingAt: {
      type: Date,
      required: true,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    isProcessing: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "past_due", "canceled"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", schema);
