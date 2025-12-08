import express from "express";
import Customer from "../models/Customer.js";
import UserMembership from "../models/UserMembership.js";   // ✅ REQUIRED
import { getAllowedDomains } from "../controllers/universityAuthController.js";

const router = express.Router();

/* ============================================================
   🎁 ADMIN: View All Referral Rewards
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

    // -------------------- DOMAIN CHECK --------------------
    const allowedDomains = await getAllowedDomains();
    const emailLower = (referrer.email || "").toLowerCase();
    const isUniversity = allowedDomains.some((d) => emailLower.endsWith(d));

    // -------------------- PLAN CHECK --------------------
    const activeMembership = await UserMembership.findOne({
      userId: referrer._id,
      isActive: true,
    }).populate("planId");

    const referrerPlan = activeMembership?.planId?.name || null;

    // -------------------- COMMISSION TIER --------------------
    let commissionTier = "";
    if (isUniversity) {
      commissionTier = "university";
    } else if (referrerPlan === "Starly Premium") {
      commissionTier = "premium_non_university";
    } else {
      commissionTier = "non_commission";
    }

    return res.json({
      success: true,
      valid: true,
      tier: commissionTier,
      referrer: {
        name: referrer.name,
        email: referrer.email,
        university: referrer.university,
        activePlan: referrerPlan,
      },
      message:
        commissionTier === "university"
          ? "Referral valid — University referrer (50 SR max commission)."
          : commissionTier === "premium_non_university"
          ? "Referral valid — Premium referrer (50 SR max commission)."
          : "Referral valid — No commission (non-university basic or unsubscribed).",
    });
  } catch (err) {
    console.error("❌ Referral check error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   👤 User Referral Stats
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
   🔗 Link New User to Referrer
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
   💰 CREDIT COMMISSION (Updated Full Logic)
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

    // Prevent duplicates
    const alreadyRewarded = referrer.referralHistory.some(
      (r) => r.referredUser?.toString() === user._id.toString()
    );
    if (alreadyRewarded)
      return res.json({
        success: false,
        message: "Commission already granted",
      });

    // -------------------- Eligibility Check --------------------
    const allowedDomains = await getAllowedDomains();
    const emailLower = (referrer.email || "").toLowerCase();
    const isUniversity = allowedDomains.some((d) => emailLower.endsWith(d));

    const activeMembership = await UserMembership.findOne({
      userId: referrer._id,
      isActive: true,
    }).populate("planId");

    const referrerPlan = activeMembership?.planId?.name || null;

    let eligible = false;

    if (isUniversity) {
      eligible = true;
    } else if (referrerPlan === "Starly Premium") {
      eligible = true;
    }

    // -------------------- Compute Commission --------------------
    let commission = 0;

    if (eligible) {
      commission = amount * 0.5;
      if (commission > 50) commission = 50;
    }

    // -------------------- Apply Commission --------------------
    referrer.walletBalance += commission;
    referrer.referralEarnings += commission;

    referrer.referralHistory.push({
      referredUser: user._id,
      membershipType,
      commission,
    });

    await referrer.save();

    return res.json({
      success: true,
      message:
        commission > 0
          ? `Commission credited: ${commission} SR`
          : "User referred successfully (no commission for current plan)",
      commission,
    });
  } catch (e) {
    console.error("❌ Referral commission error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
