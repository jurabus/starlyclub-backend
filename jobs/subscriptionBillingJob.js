import Subscription from "../models/Subscription.js";
import SubscriptionInvoice from "../models/SubscriptionInvoice.js";
import {
  getAuthToken,
  createOrder,
  createPaymentKey,
} from "../services/paymobService.js";
import axios from "axios";

export async function runBilling() {
  const now = new Date();

  const subs = await Subscription.find({
    status: "active",
    nextBillingAt: { $lte: now },
  });

  for (const s of subs) {
    // 🔒 Idempotency: block double charge
    const existing = await SubscriptionInvoice.findOne({
      subscriptionId: s._id,
      billingCycle: s.currentCycle,
    });
    if (existing) continue;

    try {
      const authToken = await getAuthToken();

      const order = await createOrder(authToken, s.amountCents);

      const paymentKey = await createPaymentKey({
        authToken,
        amountCents: s.amountCents,
        orderId: order.id,
        customer: s.customerSnapshot,
        integrationId: process.env.PAYMOB_INTEGRATION_ID,
        tokenize: false,
      });

      const charge = await axios.post(
        "https://accept.paymob.com/api/acceptance/payments/pay",
        {
          source: {
            identifier: s.cardToken,
            subtype: "TOKEN",
          },
          payment_token: paymentKey,
        }
      );

      const success = charge.data?.success === true;

      await SubscriptionInvoice.create({
        subscriptionId: s._id,
        amountCents: s.amountCents,
        paymobOrderId: order.id,
        paymobTxnId: charge.data.id,
        status: success ? "paid" : "failed",
        billingCycle: s.currentCycle,
        billedAt: new Date(),
      });

      if (success) {
        s.retryCount = 0;
        s.currentCycle += 1;
        s.nextBillingAt = addOneMonthSafe(s.nextBillingAt);
      } else {
        s.retryCount += 1;
        if (s.retryCount >= Number(process.env.SUBSCRIPTION_RETRY_ATTEMPTS)) {
          s.status = "past_due";
        }
      }

      await s.save();
    } catch (err) {
      console.error("Billing error:", err.message);
      s.retryCount += 1;
      if (s.retryCount >= Number(process.env.SUBSCRIPTION_RETRY_ATTEMPTS)) {
        s.status = "past_due";
      }
      await s.save();
    }
  }
}
function addOneMonthSafe(date) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);

  if (d.getDate() < day) {
    d.setDate(0); // last day of previous month
  }
  return d;
}
