import mongoose from "mongoose";

const paymentIntentSchema = new mongoose.Schema(
  {
    /* ================= ACTOR ================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },

    sessionId: {
      type: String,
      default: null,
    },

    /* ================= PAYMENT TYPE ================= */
    type: {
      type: String,
      enum: [
        "provider_purchase",
        "membership_purchase", // ✅ REQUIRED
      ],
      required: true,
    },

    /* ================= GATEWAY ================= */
    gateway: {
      type: String,
      enum: ["tap", "tabby", "tamara"],
      required: true,
    },
voucherPayload: {
  type: Object,
  default: null,
},

    /* ================= AMOUNT ================= */
    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "SAR",
    },

    /* ================= MEMBERSHIP LINK ================= */
    membershipPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPayment",
      default: null,
    },

    /* ================= PROVIDER / EXTERNAL ================= */
    externalPaymentId: {
      type: String,
      default: null,
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentIntent", paymentIntentSchema);
