import jwt from "jsonwebtoken";
import MembershipPlan from "../models/MembershipPlan.js";
import UserMembership from "../models/UserMembership.js";
import Customer from "../models/Customer.js";
import Provider from "../models/Provider.js";
import MembershipPayment from "../models/MembershipPayment.js";
import PaymentIntent from "../models/PaymentIntent.js";
import Subscription from "../models/Subscription.js";

/* =========================================================
   HELPERS
   ========================================================= */

const DAYS_IN_MONTH = 30;

function daysForCycle(cycle) {
  return cycle === "yearly" ? 365 : DAYS_IN_MONTH;
}

/* =========================================================
   PLANS CRUD (ADMIN)
   ========================================================= */

export const createPlan = async (req, res) => {
  const { name, imageUrl, fraction, monthlyPrice, isActive } = req.body;

  if (fraction < 0 || fraction > 1)
    return res
      .status(400)
      .json({ success: false, message: "fraction must be between 0 and 1" });

  if (monthlyPrice <= 0)
    return res
      .status(400)
      .json({ success: false, message: "monthlyPrice must be > 0" });

  const plan = await MembershipPlan.create({
    name,
    imageUrl,
    fraction,
    monthlyPrice,
    isActive,
  });

  res.status(201).json({ success: true, plan });
};

export const listPlans = async (_req, res) => {
  const plans = await MembershipPlan.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, plans });
};

export const getPlan = async (req, res) => {
  const plan = await MembershipPlan.findById(req.params.id);
  if (!plan)
    return res
      .status(404)
      .json({ success: false, message: "Plan not found" });

  res.json({ success: true, plan });
};

export const updatePlan = async (req, res) => {
  const { name, imageUrl, fraction, monthlyPrice, isActive } = req.body;

  if (fraction != null && (fraction < 0 || fraction > 1))
    return res
      .status(400)
      .json({ success: false, message: "fraction must be between 0 and 1" });

  if (monthlyPrice != null && monthlyPrice <= 0)
    return res
      .status(400)
      .json({ success: false, message: "monthlyPrice must be > 0" });

  const plan = await MembershipPlan.findByIdAndUpdate(
    req.params.id,
    { name, imageUrl, fraction, monthlyPrice, isActive },
    { new: true }
  );

  if (!plan)
    return res
      .status(404)
      .json({ success: false, message: "Plan not found" });

  res.json({ success: true, plan });
};

export const deletePlan = async (req, res) => {
  const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
  if (!plan)
    return res
      .status(404)
      .json({ success: false, message: "Plan not found" });

  res.json({ success: true, message: "Plan deleted" });
};

/* =========================================================
   MEMBERSHIP PAYMENT REQUEST (CREATE INTENT)
   ========================================================= */

export const createMembershipPayment = async (req, res) => {
  const { planId, cycle } = req.body;
  const userId = req.user.id;

  const plan = await MembershipPlan.findById(planId);
  if (!plan)
    return res
      .status(404)
      .json({ success: false, message: "Plan not found" });

  const days = daysForCycle(cycle);
  const amount =
    cycle === "yearly"
      ? plan.monthlyPrice * 12 * 0.6
      : plan.monthlyPrice;

  const paymentIntent = await PaymentIntent.create({
    userId,
    orderId: new PaymentIntent()._id, // logical orderId
    type: "membership_purchase",
    amountCents: Math.round(amount * 100),
    metadata: { cycle },
  });

  const mp = await MembershipPayment.create({
    userId,
    planId,
    paymentIntentId: paymentIntent._id,
    amount,
    cycle,
    days,
  });

  paymentIntent.metadata.membershipPaymentId = mp._id;
  await paymentIntent.save();

  res.json({
    success: true,
    paymentIntentId: paymentIntent._id,
  });
};

/* =========================================================
   MEMBERSHIP ACTIVATION (CLIENT ACK)
   ========================================================= */

export const activateMembership = async (_req, res) => {
  // 🔒 Webhook is the only authority
  res.json({ success: true });
};

/* =========================================================
   ADMIN MANUAL ASSIGN (NO PAYMENT)
   ========================================================= */

export const assignMembership = async (req, res) => {
  const { userId, planId, months = 1 } = req.body;

  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + Number(months));

  const membership = await UserMembership.findOneAndUpdate(
    { userId },
    {
      userId,
      planId,
      startDate: start,
      endDate: end,
      isActive: true,
    },
    { upsert: true, new: true }
  ).populate("planId");

  res.json({
    success: true,
    message: "Membership assigned successfully",
    membership,
  });
};

/* =========================================================
   USER CARD + QR
   ========================================================= */

export const getUserCard = async (req, res) => {
  const membership = await UserMembership.findOne({
    userId: req.params.userId,
  }).populate("planId");

  if (!membership)
    return res
      .status(404)
      .json({ success: false, message: "Membership not found" });

  const now = new Date();
  const valid =
    membership.isActive &&
    membership.startDate <= now &&
    now <= membership.endDate;

  const qrToken = jwt.sign(
    { memId: membership._id },
    process.env.JWT_SECRET,
    { expiresIn: "2m" }
  );

  res.json({
    success: true,
    card: {
      membershipType: membership.planId.name,
      planId: membership.planId._id,
      planImage: membership.planId.imageUrl,
      startDate: membership.startDate,
      endDate: membership.endDate,
      isValid: valid,
      qrToken,
    },
  });
};

/* =========================================================
   PROVIDER SCAN
   ========================================================= */

export const scanMembership = async (req, res) => {
  const { qrToken, providerId, providerUsername, accessKey } = req.body;

  if (!qrToken)
    return res
      .status(400)
      .json({ success: false, message: "Missing qrToken" });

  let decoded;
  try {
    decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired QR token" });
  }

  const provider =
    providerId
      ? await Provider.findById(providerId)
      : await Provider.findOne({ providerUsername, accessKey });

  if (!provider)
    return res
      .status(404)
      .json({ success: false, message: "Provider not authorized" });

  const membership = await UserMembership.findById(decoded.memId).populate(
    "planId"
  );

  if (!membership)
    return res
      .status(404)
      .json({ success: false, message: "Membership not found" });

  const now = new Date();
  const valid =
    membership.isActive &&
    membership.startDate <= now &&
    now <= membership.endDate;

  const providerMax = Number(provider.maximumDiscount || 0);
  const fraction = Number(membership.planId.fraction || 0);

  const discount = valid
    ? Math.min(providerMax, Math.floor(providerMax * fraction))
    : 0;

  res.json({
    success: true,
    result: {
      valid,
      discountPercent: discount,
      membershipType: membership.planId.name,
    },
  });
};

/* =========================================================
   FINALIZE PAYMOB PAYMENT (WEBHOOK ONLY)
   ========================================================= */

export const finalizeMembershipPayment = async (paymentIntent) => {
  const mp = await MembershipPayment.findById(
    paymentIntent.metadata.membershipPaymentId
  );

  if (!mp || mp.status === "paid") return;

  mp.status = "paid";
  mp.paidAt = new Date();
  await mp.save();

  const existing = await UserMembership.findOne({ userId: mp.userId });

  const start = existing ? existing.startDate : new Date();
  const end = existing ? new Date(existing.endDate) : new Date();
  end.setDate(end.getDate() + mp.days);

  await UserMembership.findOneAndUpdate(
    { userId: mp.userId },
    {
      userId: mp.userId,
      planId: mp.planId,
      startDate: start,
      endDate: end,
      isActive: true,
    },
    { upsert: true }
  );
};
