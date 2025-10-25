import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
  amount: Number,
  method: String,
  details: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
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
  joinedAt: { type: Date, default: Date.now },
});

customerSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode = "STARLY" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

export default mongoose.model("Customer", customerSchema);
