import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },

    paymentIntentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentIntent",
      required: true,
      unique: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    cycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },

    days: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("MembershipPayment", schema);
