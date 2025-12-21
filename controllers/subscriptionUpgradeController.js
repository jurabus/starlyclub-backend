import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import PaymentIntent from "../models/PaymentIntent.js";
import { calculateProration } from "../services/prorationService.js";
import { getAuthToken, createOrder, paymentKey } from "../services/paymobService.js";

export const changePlan = async (req, res) => {
  const { newPlanId } = req.body;
  const userId = req.user.id;

  const sub = await Subscription.findOne({ userId, status: "active" });
  if (!sub) return res.status(404).json({ message: "No active subscription" });

  const currentPlan = await Plan.findById(sub.planId);
  const newPlan = await Plan.findById(newPlanId);

  const now = new Date();
  const nextBilling = sub.nextBillingAt;
  const lastBilling = new Date(sub.nextBillingAt);
  lastBilling.setMonth(lastBilling.getMonth() - 1);

  // 🔼 UPGRADE
  if (newPlan.price > currentPlan.price) {
    const amountDue = calculateProration({
      currentAmount: currentPlan.price * 100,
      newAmount: newPlan.price * 100,
      billingStart: lastBilling,
      billingEnd: nextBilling,
    });

    const token = await getAuthToken();
    const order = await createOrder(token, amountDue);
    const payKey = await paymentKey(
      token,
      order.id,
      amountDue,
      req.user,
      process.env.PAYMOB_INTEGRATION_ID_CARD
    );

    await PaymentIntent.create({
      userId,
      orderId: order.id,
      amountCents: amountDue,
      paymobOrderId: order.id,
      paymobPaymentKey: payKey,
    });

    return res.json({
      type: "upgrade",
      paymentRequired: true,
      paymentKey: payKey,
    });
  }

  // 🔽 DOWNGRADE (DEFERRED)
  sub.pendingPlanId = newPlan._id;
  sub.pendingAmountCents = newPlan.price * 100;
  await sub.save();

  res.json({
    type: "downgrade",
    paymentRequired: false,
    effectiveAt: sub.nextBillingAt,
  });
};
