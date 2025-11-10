// controllers/membershipController.js
import jwt from "jsonwebtoken";
import MembershipPlan from "../models/MembershipPlan.js";
import UserMembership from "../models/UserMembership.js";
import Customer from "../models/Customer.js";
import Provider from "../models/Provider.js";

/* -------------------- Admin: Plans CRUD -------------------- */

export const createPlan = async (req, res) => {
  try {
    const { name, imageUrl, fraction, isActive } = req.body;
    if (fraction == null || fraction < 0 || fraction > 1)
      return res.status(400).json({ success: false, message: "fraction must be between 0 and 1" });

    const plan = await MembershipPlan.create({ name, imageUrl, fraction, isActive });
    res.status(201).json({ success: true, plan });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// controllers/membershipController.js  ✅ Update listPlans
export const listPlans = async (_req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, plans });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};


export const getPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, plan });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { name, imageUrl, fraction, isActive } = req.body;
    if (fraction != null && (fraction < 0 || fraction > 1))
      return res.status(400).json({ success: false, message: "fraction must be between 0 and 1" });

    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      { name, imageUrl, fraction, isActive },
      { new: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, plan });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, message: "Plan deleted" });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

/* -------------------- Admin: Assign / Create Membership -------------------- */

/* -------------------- Admin: Assign / Create Membership -------------------- */
export const assignMembership = async (req, res) => {
  try {
    const { userId, planId, startDate, endDate, months, cardCode, amount } = req.body;

    const user = await Customer.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const plan = await MembershipPlan.findById(planId);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : null;
    if (!end) {
      const m = Number(months) > 0 ? Number(months) : 12;
      end = new Date(start);
      end.setMonth(end.getMonth() + m);
    }

    // Upsert (one active membership per user)
    const membership = await UserMembership.findOneAndUpdate(
      { userId },
      {
        userId,
        planId,
        startDate: start,
        endDate: end,
        cardCode,
        isActive: true,
      },
      { new: true, upsert: true }
    ).populate("planId");

    /* -------------------------------------------
       💸 AUTO REFERRAL COMMISSION TRIGGER
       ------------------------------------------- */
    if (user.referredBy && Number(amount) > 0) {
      try {
        const referrer = await Customer.findById(user.referredBy);
        if (referrer) {
          const alreadyRewarded = referrer.referralHistory.some(
            (r) => r.referredUser?.toString() === user._id.toString()
          );
          if (!alreadyRewarded) {
            const commission = Number(amount) * 0.5; // 50 %
            referrer.walletBalance += commission;
            referrer.referralEarnings += commission;
            referrer.referralHistory.push({
              referredUser: user._id,
              membershipType: plan.name,
              commission,
            });
            await referrer.save();

            console.log(
              `💰 Referral bonus: ${commission} credited to ${referrer.name || referrer.email}`
            );
          }
        }
      } catch (e) {
        console.error("Referral reward error:", e.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Membership assigned successfully",
      membership,
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};


/* -------------------- User: Get Card + QR Token -------------------- */

export const getUserCard = async (req, res) => {
  try {
    const { userId } = req.params;

    const [user, membership] = await Promise.all([
      Customer.findById(userId),
      UserMembership.findOne({ userId }).populate("planId"),
    ]);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!membership) return res.status(404).json({ success: false, message: "Membership not found" });

    const now = new Date();
    const valid = membership.isActive && membership.startDate <= now && now <= membership.endDate;

    // Short-lived QR token for scanning (2 minutes)
    const qrToken = jwt.sign(
      {
        sub: String(user._id),
        memId: String(membership._id),
      },
      process.env.JWT_SECRET,
      { expiresIn: "2m" }
    );

    res.json({
      success: true,
      card: {
        userName: user.name || user.email,
        membershipType: membership.planId?.name,
        planImage: membership.planId?.imageUrl || "",
        startDate: membership.startDate,
        endDate: membership.endDate,
        isValid: valid,
        cardCode: membership.cardCode || null,
        qrToken,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* -------------------- Provider: Scan Card -------------------- */
/**
 * Expects:
 *  - body.qrToken (JWT from getUserCard)
 *  - Either body.providerId OR (body.providerUsername + body.accessKey)
 */
export const scanMembership = async (req, res) => {
  try {
    const { qrToken, providerId, providerUsername, accessKey } = req.body;
    if (!qrToken) return res.status(400).json({ success: false, message: "Missing qrToken" });

    // Verify QR token
    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired QR token" });
    }

    const userId = decoded.sub;
    const memId = decoded.memId;

    // Resolve provider by id or (username + accessKey)
    let provider = null;
    if (providerId) {
      provider = await Provider.findById(providerId);
    } else if (providerUsername && accessKey) {
      provider = await Provider.findOne({ username: providerUsername, accessKey });
    }
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found / unauthorized" });

    // Load user + membership + plan
    const [user, membership] = await Promise.all([
      Customer.findById(userId),
      UserMembership.findById(memId).populate("planId"),
    ]);

    if (!user || !membership) {
      return res.status(404).json({ success: false, message: "User or membership not found" });
    }

    const now = new Date();
    const stillValid = membership.isActive && membership.startDate <= now && now <= membership.endDate;

    // Compute eligible discount
    const providerMax = Number(provider.maximumDiscount || 0);
    const fraction = Number(membership.planId?.fraction || 0);
    let eligibleDiscount = Math.floor(providerMax * fraction); // integer percent
    if (eligibleDiscount < 0) eligibleDiscount = 0;
    if (eligibleDiscount > providerMax) eligibleDiscount = providerMax;

    // Update provider counters & history only if valid
    if (stillValid && eligibleDiscount > 0) {
      provider.scannedCardsCount = (provider.scannedCardsCount || 0) + 1;
      provider.scanHistory.push({
        userId: user._id,
        membershipType: membership.planId?.name || "",
        discountPercent: eligibleDiscount,
        scannedAt: now,
      });
      await provider.save();

      // Update user used offers history
      user.usedOffers = user.usedOffers || [];
      user.usedOffers.push({
        providerId: provider._id,
        providerName: provider.name,
        providerLogo: provider.logoUrl || "",
        membershipType: membership.planId?.name || "",
        discountPercent: eligibleDiscount,
        scannedAt: now,
      });
      await user.save();

      // touch membership
      membership.lastScanAt = now;
      await membership.save();
    }

    res.json({
      success: true,
      result: {
        userName: user.name || user.email,
        membershipType: membership.planId?.name,
        valid: !!stillValid,
        discountPercent: stillValid ? eligibleDiscount : 0,
        provider: {
          id: provider._id,
          name: provider.name,
          image: provider.logoUrl || "",
        },
        scannedAt: now,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
