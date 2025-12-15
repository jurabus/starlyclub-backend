// models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: String,
  imageUrl: String,
  price: Number,
  quantity: Number,
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },

    sessionId: { type: String },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    items: [orderItemSchema],

    total: Number,
	payment: {
  gateway: String,
  paymentIntentId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    unique: true,
  },
  paidAt: Date,
},




    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "ignored"],
      default: "pending",
    },

    cancelReason: { type: String, default: "" },

    expiresAt: { type: Date }, // auto created
  },
  { timestamps: true }
);

// AUTO-SET EXPIRY DATE = 5 minutes after creation
orderSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  }
  next();
});

export default mongoose.model("Order", orderSchema);
