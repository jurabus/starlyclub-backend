// controllers/membershipController.js
import jwt from "jsonwebtoken";
import MembershipPlan from "../models/MembershipPlan.js";
import UserMembership from "../models/UserMembership.js";
import Customer from "../models/Customer.js";
import Provider from "../models/Provider.js";
import MembershipPayment from "../models/MembershipPayment.js";


const DAYS_PER_MONTH = 28;
const YEARLY_DISCOUNT = 0.4; // 40%

/* -------------------- Admin: Plans CRUD -------------------- */

export const createPlan = async (req, res) => {
  try {
    const { name, imageUrl, fraction, monthlyPrice, isActive } = req.body;

    if (fraction == null || fraction < 0 || fraction > 1)
      return res.status(400).json({ success: false, message: "fraction must be between 0 and 1" });

    if (monthlyPrice == null || monthlyPrice <= 0)
      return res.status(400).json({ success: false, message: "monthlyPrice must be > 0" });

    const plan = await MembershipPlan.create({
      name,
      imageUrl,
      fraction,
      monthlyPrice,
      isActive,
    });

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
// ===========================================
// 🚀 RENEW ACTIVE MEMBERSHIP (1 MONTH)
// ===========================================
export const renewMembership = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId)
      return res.status(400).json({ success: false, message: "Missing userId" });

    const user = await Customer.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const membership = await UserMembership.findOne({ userId })
      .populate("planId");

    if (!membership)
      return res.status(404).json({ success: false, message: "No active membership" });

    const plan = membership.planId;
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    // 💸 monthly price = fraction * 100 SR (example)
    const monthlyPrice = Math.round(plan.fraction * 100);

    //if (user.walletBalance < monthlyPrice) {
   //   return res.status(400).json({
     //   success: false,
      //  message: "Insufficient wallet balance",
    //  });
   // }

    // Deduct wallet
   // user.walletBalance -= monthlyPrice;
   // await user.save();

    // Extend membership 1 month
    const newEndDate = new Date(membership.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    membership.endDate = newEndDate;
    membership.isActive = true;
    await membership.save();

    res.json({
      success: true,
      message: "Membership renewed successfully!",
      newEndDate,
      walletBalance: user.walletBalance,
    });
  } catch (e) {
    console.error("❌ renewMembership error:", e);
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
    const { name, imageUrl, fraction, monthlyPrice, isActive } = req.body;

    if (fraction != null && (fraction < 0 || fraction > 1))
      return res.status(400).json({ success: false, message: "fraction must be between 0 and 1" });

    if (monthlyPrice != null && monthlyPrice <= 0)
      return res.status(400).json({ success: false, message: "monthlyPrice must be > 0" });

    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      { name, imageUrl, fraction, monthlyPrice, isActive },
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
    const { userId, planId, months } = req.body;

    const user = await Customer.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const plan = await MembershipPlan.findById(planId);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    /* ---------------------------------------------------
     🔥 MEMBERSHIP PRICE (You can modify this anytime)
     ---------------------------------------------------*/
    const RENEW_PRICE = 20;         // renewing same plan = 20 SR
    const MIGRATE_PRICE = 20;       // migrating to another plan = 20 SR

    // Check existing membership
    const existing = await UserMembership.findOne({ userId });

    let chargeAmount = 0;

    if (existing) {
      const existingPlanId = existing.planId?.toString();
      const samePlan = existingPlanId === planId.toString();

      if (samePlan) {
        // 🔄 RENEW
        chargeAmount = RENEW_PRICE;
      } else {
        // 🔀 MIGRATE
        chargeAmount = MIGRATE_PRICE;
      }
    } else {
      // 🆕 NEW SUBSCRIPTION (1 year)
      chargeAmount = 20; // If you want new plan to cost same = 20 SR
    }

    /* ---------------------------------------------------
     🔥 Deduct from wallet
     ---------------------------------------------------*/
   // if (user.walletBalance < chargeAmount) {
   //   return res.status(400).json({
    //    success: false,
   //     message: "Insufficient wallet balance",
  //    });
  //  }

  //  user.walletBalance -= chargeAmount;
  //  await user.save();

    /* ---------------------------------------------------
     🔄 Calculate new membership start/end
     ---------------------------------------------------*/
    let start = existing ? existing.startDate : new Date();
    let end = existing ? new Date(existing.endDate) : new Date();

    // Extend or set new months
    const extendMonths = Number(months) > 0 ? Number(months) : 1;
    end.setMonth(end.getMonth() + extendMonths);

    /* ---------------------------------------------------
     🔐 UPSERT INTO DB
     ---------------------------------------------------*/
    const membership = await UserMembership.findOneAndUpdate(
      { userId },
      {
        userId,
        planId,
        startDate: start,
        endDate: end,
        isActive: true,
      },
      { new: true, upsert: true }
    ).populate("planId");
/* ----------------------------------------------------------
   ⭐ REFERRAL COMMISSION TRIGGER (NEW PATCH)
   ----------------------------------------------------------*/
try {
  if (user.referredBy) {
    const commissionAmount = chargeAmount; // final price paid by the user

    await fetch(
      "https://starlyclub-backend.onrender.com/api/referral/commission",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          membershipType: plan.name,   // e.g. "Starly Premium"
          amount: commissionAmount,     // real paid amount, ex: 99, 199, 299 or 20
        }),
      }
    );
  }
} catch (e) {
  console.error("❌ Referral commission auto-trigger failed:", e.message);
}

    res.status(201).json({
      success: true,
      message: existing
        ? (existing.planId.toString() === planId.toString()
            ? "Membership renewed successfully"
            : "Membership migrated successfully")
        : "Membership activated successfully",
      membership,
      newBalance: user.walletBalance,
    });
  } catch (e) {
    console.error("Assign error:", e);
    res.status(500).json({ success: false, message: e.message });
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
		planId: membership.planId?._id,   
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

export const createMembershipPayment = async (req, res) => {
  try {
    const { userId, planId, gateway, cycle } = req.body;

    if (!["monthly", "yearly"].includes(cycle)) {
      return res.status(400).json({ success: false, message: "Invalid cycle" });
    }

    const plan = await MembershipPlan.findById(planId);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    const months = cycle === "monthly" ? 1 : 12;
    const days = months * 28;

    let amount = plan.monthlyPrice * months;

    if (cycle === "yearly") {
      amount = Math.round(amount * 0.6); // 🔥 40% OFF
    }

    const intent = await MembershipPayment.create({
      userId,
      planId,
      gateway,
      amount,
      cycle,
      days,
      status: "pending",
    });

    const paymentUrl = `https://starlyclub-backend.onrender.com/api/payments/${gateway}/create?membershipPaymentId=${intent._id}`;

    res.json({ success: true, paymentUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};




export const finalizeMembershipPayment = async (paymentIntent) => {
  const intent = await MembershipPayment.findById(
    paymentIntent.metadata.membershipPaymentId
  );

  if (!intent || intent.status === "paid") return;

  intent.status = "paid";
  intent.paidAt = new Date();
  await intent.save();

  const { userId, planId, days } = intent;

  const existing = await UserMembership.findOne({ userId });

  const start = existing ? existing.startDate : new Date();
  const end = existing ? new Date(existing.endDate) : new Date();

  end.setDate(end.getDate() + days);

  await UserMembership.findOneAndUpdate(
    { userId },
    {
      userId,
      planId,
      startDate: start,
      endDate: end,
      isActive: true,
    },
    { upsert: true }
  );
};

