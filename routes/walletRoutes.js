import express from "express";
import Customer from "../models/Customer.js";
import { requestWithdrawal } from "../controllers/walletController.js";
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
router.post("/withdraw", requestWithdrawal);

export default router;
