import PaymentIntent from "../models/PaymentIntent.js";
import MembershipPayment from "../models/MembershipPayment.js";
import UserMembership from "../models/UserMembership.js";
import Subscription from "../models/Subscription.js";
import SubscriptionInvoice from "../models/SubscriptionInvoice.js";

/* =========================================================
   PAYMOB WEBHOOK HANDLER
   ========================================================= */

export const handlePaymobWebhook = async (req, res) => {
  const data = req.body;

  // Paymob retries aggressively — always return 200
  if (!data?.success || !data?.order?.id) {
    return res.sendStatus(200);
  }

  // 🔒 HARD idempotency lock
  const intent = await PaymentIntent.findOneAndUpdate(
    {
      paymobOrderId: data.order.id,
      status: { $ne: "paid" },
    },
    {
      status: "paid",
      paidAt: new Date(),
      paymobTxnId: data.id,
    },
    { new: true }
  );

  if (!intent) return res.sendStatus(200);

  try {
    if (intent.type === "membership_purchase") {
      await finalizeMembership(intent);
    }

    if (intent.type === "subscription_charge") {
      await finalizeSubscription(intent);
    }
  } catch (e) {
    console.error("❌ Webhook finalize error:", e.message);
    // Do NOT throw — Paymob will retry
  }

  return res.sendStatus(200);
};

/* =========================================================
   MEMBERSHIP FINALIZATION
   ========================================================= */

async function finalizeMembership(intent) {
  const mp = await MembershipPayment.findById(
    intent.metadata.membershipPaymentId
  );

  if (!mp || mp.status === "paid") return;

  mp.status = "paid";
  mp.paidAt = new Date();
  await mp.save();

  const existing = await UserMembership.findOne({ userId: mp.userId });

  // 🆕 NEW OR RENEW
  if (!existing) {
    const end = new Date();
    end.setDate(end.getDate() + mp.days);

    await UserMembership.create({
      userId: mp.userId,
      planId: mp.planId,
      startDate: new Date(),
      endDate: end,
      isActive: true,
    });
    return;
  }

  // 🔄 RENEW SAME PLAN
  if (existing.planId.toString() === mp.planId.toString()) {
    const end = new Date(existing.endDate);
    end.setDate(end.getDate() + mp.days);
    existing.endDate = end;
    await existing.save();
    return;
  }

  // 🆙 UPGRADE (immediate)
  const upgradeEnd = new Date();
  upgradeEnd.setDate(upgradeEnd.getDate() + mp.days);

  existing.planId = mp.planId;
  existing.startDate = new Date();
  existing.endDate = upgradeEnd;
  await existing.save();
}

/* =========================================================
   SUBSCRIPTION FINALIZATION
   ========================================================= */

async function finalizeSubscription(intent) {
  const s = await Subscription.findById(intent.metadata.subscriptionId);
  if (!s) return;

  // 🔒 Invoice idempotency
  const alreadyBilled = await SubscriptionInvoice.findOne({
    subscriptionId: s._id,
    billingCycle: s.currentCycle,
  });

  if (alreadyBilled) return;

  await SubscriptionInvoice.create({
    subscriptionId: s._id,
    paymentIntentId: intent._id,
    billingCycle: s.currentCycle,
    amountCents: intent.amountCents,
    status: "paid",
    billedAt: new Date(),
  });

  // Advance billing safely
  s.currentCycle += 1;
  s.nextBillingAt = addOneMonthSafe(s.nextBillingAt);

  // 🔽 Apply deferred downgrade
  if (s.pendingPlanId) {
    s.planId = s.pendingPlanId;
    s.amountCents = s.pendingAmountCents;
    s.pendingPlanId = null;
    s.pendingAmountCents = null;
  }

  s.retryCount = 0;
  await s.save();
}

/* =========================================================
   DATE SAFETY
   ========================================================= */

function addOneMonthSafe(date) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);

  if (d.getDate() < day) {
    d.setDate(0); // last day of previous month
  }
  return d;
}
