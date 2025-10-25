import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

/**
 * ✅ GET /api/referral/:userId
 * Fetch user's referral stats, code, wallet, and referral history
 */
router.get("/:userId", async (req, res) => {
  try {
    const user = await Customer.findById(req.params.userId).populate({
      path: "referralHistory.referredUser",
      select: "name email university",
    });

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance,
      referralEarnings: user.referralEarnings,
      totalReferrals: user.referralHistory.length,
      referralHistory: user.referralHistory,
    });
  } catch (e) {
    console.error("Referral GET error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ POST /api/referral/link
 * Links a new user to a referrer during registration
 */
router.post("/link", async (req, res) => {
  try {
    const { referralCode, newUserEmail } = req.body;
    if (!referralCode || !newUserEmail)
      return res
        .status(400)
        .json({ success: false, message: "Missing referralCode or email" });

    const referrer = await Customer.findOne({ referralCode: referralCode.trim() });
    const newUser = await Customer.findOne({ email: newUserEmail });

    if (!referrer)
      return res.status(404).json({ success: false, message: "Referrer not found" });
    if (!newUser)
      return res.status(404).json({ success: false, message: "New user not found" });
    if (newUser.referredBy)
      return res
        .status(400)
        .json({ success: false, message: "User already linked to a referrer" });

    newUser.referredBy = referrer._id;
    await newUser.save();

    res.json({ success: true, message: "Referral successfully linked" });
  } catch (e) {
    console.error("Referral link error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ POST /api/referral/commission
 * Awards 50% commission to referrer when referred user purchases first membership
 * Body: { userId, membershipType, amount }
 */
router.post("/commission", async (req, res) => {
  try {
    const { userId, membershipType, amount } = req.body;

    if (!userId || !amount)
      return res.status(400).json({ success: false, message: "Missing data" });

    const user = await Customer.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (!user.referredBy)
      return res.json({ success: true, message: "No referrer associated" });

    const referrer = await Customer.findById(user.referredBy);
    if (!referrer)
      return res.status(404).json({ success: false, message: "Referrer not found" });

    // Prevent double reward
    const alreadyRewarded = referrer.referralHistory.some(
      (r) => r.referredUser?.toString() === user._id.toString()
    );
    if (alreadyRewarded)
      return res.json({ success: false, message: "Commission already granted" });

    const commission = amount * 0.5; // 50%
    referrer.walletBalance += commission;
    referrer.referralEarnings += commission;

    referrer.referralHistory.push({
      referredUser: user._id,
      membershipType,
      commission,
    });

    await referrer.save();

    res.json({
      success: true,
      message: "Commission credited successfully",
      commission,
    });
  } catch (e) {
    console.error("Referral commission error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
