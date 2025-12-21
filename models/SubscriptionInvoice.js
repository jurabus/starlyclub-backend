import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
    },

    paymentIntentId: {
      type: mongoose.Schema.Types.ObjectId,
      unique: true, // 🔒 Idempotency
      required: true,
    },

    billingCycle: {
      type: Number,
      required: true,
    },

    amountCents: Number,

    status: {
      type: String,
      enum: ["paid", "failed"],
      required: true,
    },

    billedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("SubscriptionInvoice", schema);
