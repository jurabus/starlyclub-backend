// models/Customer.js
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
  amount: Number,
  method: String,
  details: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now },
});

const referralRecordSchema = new mongoose.Schema({
  referredUser: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  membershipType: String,
  commission: Number,
  createdAt: { type: Date, default: Date.now },
});

const customerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  age: Number,
  phone: String,
  university: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,

  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  walletBalance: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },
  withdrawalRequests: [withdrawalSchema],
  referralHistory: [referralRecordSchema],

  // 🛒 Persistent Cart Reference
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    default: null,
  },

  // 🏠 Optional future checkout fields
  address: {
    type: String,
    default: "",
  },
  preferredPayment: {
    type: String,
    enum: ["wallet", "credit_card", "cash_on_delivery", "none"],
    default: "none",
  },
  // PATCH for models/Customer.js
// Add the following block inside your existing customerSchema:

usedOffers: [
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    providerName: String,
    providerLogo: String,
    membershipType: String,   // plan name at scan time
    discountPercent: Number,  // computed discount at scan time
    scannedAt: { type: Date, default: Date.now },
  },
],


  joinedAt: { type: Date, default: Date.now },
});

// 🔑 Auto-generate referral code
customerSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode =
      "STARLY" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// 🧹 Optional cleanup hook (remove orphaned cart if customer deleted)
customerSchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc?.cartId) {
    try {
      await mongoose.model("Cart").findByIdAndDelete(doc.cartId);
    } catch (err) {
      console.error("⚠️ Failed to delete customer cart:", err.message);
    }
  }
  next();
});

export default mongoose.model("Customer", customerSchema);
