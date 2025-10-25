import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

/**
 * ✅ GET /api/wallet/:userId
 * Returns live wallet balance, earnings, and withdrawals
 */
router.get("/:userId", async (req, res) => {
  try {
    const user = await Customer.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      walletBalance: user.walletBalance,
      referralEarnings: user.referralEarnings,
      withdrawals: user.withdrawalRequests || [],
    });
  } catch (e) {
    console.error("Wallet GET error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ POST /api/wallet/withdraw
 * Request a withdrawal (if balance is sufficient)
 * Body: { userId, amount }
 */
router.post("/withdraw", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount)
      return res.status(400).json({ success: false, message: "Missing data" });
    if (amount <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid withdrawal amount" });

    const user = await Customer.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (user.walletBalance < amount)
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });

    // Deduct & record
    user.walletBalance -= amount;
    user.withdrawalRequests.push({ amount, method: req.body.method, details: req.body.details });

    await user.save();

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      newBalance: user.walletBalance,
    });
  } catch (e) {
    console.error("Wallet withdraw error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
