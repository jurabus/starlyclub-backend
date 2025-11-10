import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

/* ============================================================
   🎁 ADMIN: View All Referral Rewards (must come BEFORE /:userId)
   ============================================================ */
router.get("/rewards", async (req, res) => {
  try {
    const customers = await Customer.find({})
      .populate({
        path: "referralHistory.referredUser",
        select: "name email university",
      })
      .select("name email referralHistory");

    const records = [];

    for (const customer of customers) {
      for (const record of customer.referralHistory || []) {
        records.push({
          referrer: { name: customer.name, email: customer.email },
          referredUser: record.referredUser,
          membershipType: record.membershipType,
          commission: record.commission,
          createdAt: record.createdAt,
        });
      }
    }

    // Sort newest first
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, records });
  } catch (err) {
    console.error("❌ Referral rewards fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   🎓 Check Referral Code Validity
   ============================================================ */
const ALLOWED_DOMAINS = ["@harvard.edu", "@cairo.edu", "@oxford.ac.uk"];

router.get("/check/:referralCode", async (req, res) => {
  try {
    const code = req.params.referralCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid referral code format" });
    }

    const referrer = await Customer.findOne({ referralCode: code });
    if (!referrer)
      return res
        .status(404)
        .json({ success: false, message: "Referral code not found" });

    const email = referrer.email?.toLowerCase() || "";
    const isUniversity = ALLOWED_DOMAINS.some((d) => email.endsWith(d));

    if (!isUniversity) {
      return res.status(403).json({
        success: false,
        valid: false,
        message:
          "Referrer is not from an authorized university domain. Referral invalid.",
      });
    }

    res.json({
      success: true,
      valid: true,
      referrer: {
        name: referrer.name,
        email: referrer.email,
        university: referrer.university,
      },
      message: "Referral code valid and belongs to a university member",
    });
  } catch (err) {
    console.error("❌ Referral check error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   👤 Get User Referral Stats (code, wallet, history)
   ============================================================ */
router.get("/:userId", async (req, res) => {
  try {
    const user = await Customer.findById(req.params.userId).populate({
      path: "referralHistory.referredUser",
      select: "name email university",
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance,
      referralEarnings: user.referralEarnings,
      totalReferrals: user.referralHistory.length,
      referralHistory: user.referralHistory,
    });
  } catch (e) {
    console.error("❌ Referral GET error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   🔗 Link New User to Referrer During Registration
   ============================================================ */
router.post("/link", async (req, res) => {
  try {
    const { referralCode, newUserEmail } = req.body;
    if (!referralCode || !newUserEmail)
      return res
        .status(400)
        .json({ success: false, message: "Missing referralCode or email" });

    const referrer = await Customer.findOne({
      referralCode: referralCode.trim().toUpperCase(),
    });
    const newUser = await Customer.findOne({ email: newUserEmail });

    if (!referrer)
      return res
        .status(404)
        .json({ success: false, message: "Referrer not found" });
    if (!newUser)
      return res
        .status(404)
        .json({ success: false, message: "New user not found" });
    if (newUser.referredBy)
      return res.status(400).json({
        success: false,
        message: "User already linked to a referrer",
      });

    newUser.referredBy = referrer._id;
    await newUser.save();

    res.json({ success: true, message: "Referral successfully linked" });
  } catch (e) {
    console.error("❌ Referral link error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   💰 Credit Commission to Referrer (50%)
   ============================================================ */
router.post("/commission", async (req, res) => {
  try {
    const { userId, membershipType, amount } = req.body;

    if (!userId || !amount)
      return res
        .status(400)
        .json({ success: false, message: "Missing data" });

    const user = await Customer.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.referredBy)
      return res.json({
        success: true,
        message: "No referrer associated",
      });

    const referrer = await Customer.findById(user.referredBy);
    if (!referrer)
      return res
        .status(404)
        .json({ success: false, message: "Referrer not found" });

    // Prevent duplicate commissions
    const alreadyRewarded = referrer.referralHistory.some(
      (r) => r.referredUser?.toString() === user._id.toString()
    );
    if (alreadyRewarded)
      return res.json({
        success: false,
        message: "Commission already granted",
      });

    const commission = amount * 0.5;
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
    console.error("❌ Referral commission error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
