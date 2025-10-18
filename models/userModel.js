import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    membership: { type: String, default: "Free" },
    balance: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
