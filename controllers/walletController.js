import Customer from "../models/Customer.js";
import mongoose from "mongoose";

const MIN_WITHDRAWAL = 1000;

export const requestWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, amount, method, tapDestinationId } = req.body;

    if (amount < MIN_WITHDRAWAL) {
      throw new Error("Minimum withdrawal is 1000 SR");
    }

    const user = await Customer.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    if (user.walletBalance < amount) {
      throw new Error("Insufficient balance");
    }

    // 🔒 Lock balance
    user.walletBalance -= amount;

    user.withdrawalRequests.push({
      amount,
      method,
      tapDestinationId: method === "tap" ? tapDestinationId : null,
      status: "pending",
    });

    await user.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({ success: true });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: e.message });
  }
};
