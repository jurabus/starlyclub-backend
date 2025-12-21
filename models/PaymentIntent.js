import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true, // 🔒 HARD idempotency
    },

    type: {
      type: String,
      enum: [
        "membership_purchase",
        "subscription_charge",
        "upgrade_proration",
      ],
      required: true,
    },

    amountCents: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "EGP",
    },

    gateway: {
      type: String,
      enum: ["paymob"],
      default: "paymob",
    },

    paymobOrderId: String,
    paymobPaymentKey: String,
    paymobTxnId: String,

    cardToken: String,
    cardLast4: String,
    cardType: String,

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    metadata: {
      membershipPaymentId: mongoose.Schema.Types.ObjectId,
      subscriptionId: mongoose.Schema.Types.ObjectId,
      newPlanId: mongoose.Schema.Types.ObjectId,
      billingCycle: Number,
      cycle: { type: String, enum: ["monthly", "yearly"] },
    },

    paidAt: Date,
    refundedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("PaymentIntent", schema);
