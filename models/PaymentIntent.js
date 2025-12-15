import mongoose from "mongoose";

const paymentIntentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
sessionId: {
  type: String,
},

    type: {
      type: String,
      enum: ["provider_purchase", "membership"],
      required: true,
    },

    gateway: {
      type: String,
      enum: ["tap", "tabby", "tamara"],
      required: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: "SAR" },

    externalPaymentId: String,
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentIntent", paymentIntentSchema);
