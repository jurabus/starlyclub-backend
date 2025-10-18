import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  age: Number,
  phone: String,
  university: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  joinedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Customer", customerSchema);
