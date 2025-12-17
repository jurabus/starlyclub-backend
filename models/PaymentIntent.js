import mongoose from "mongoose";

const paymentIntentSchema = new mongoose.Schema(
  {
    /* ================= ACTOR ================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
      index: true,
    },

    sessionId: {
      type: String,
      default: null,
      index: true,
    },

    /* ================= PAYMENT TYPE ================= */
    type: {
      type: String,
      enum: [
        "provider_purchase",   // products / vouchers
        "membership_purchase", // memberships
      ],
      required: true,
      index: true,
    },

    /* ================= GATEWAY ================= */
    gateway: {
      type: String,
      enum: ["tap", "tabby", "tamara"],
      required: true,
      index: true,
    },

    /* ================= MOCK MODE ================= */
    isMock: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ================= VOUCHER PAYLOAD ================= */
    voucherPayload: {
      faceValue: { type: Number },
      discountPercent: { type: Number },
      providerName: { type: String },
      logoUrl: { type: String },
    },

    /* ================= AMOUNT ================= */
    amount: {
      type: Number,
      required: true,
      min: 0,
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
      index: true,
    },

    /* ================= PROVIDER / EXTERNAL ================= */
    externalPaymentId: {
      type: String,
      default: null,
      index: true,
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= COMPOUND INDEXES ================= */
// Fast webhook resolution
paymentIntentSchema.index({ externalPaymentId: 1, gateway: 1 });

// Prevent double-finalization
paymentIntentSchema.index({ _id: 1, status: 1 });

export default mongoose.model("PaymentIntent", paymentIntentSchema);
