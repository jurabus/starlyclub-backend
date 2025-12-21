import PaymentIntent from "../models/PaymentIntent.js";
import Order from "../models/Order.js";
import { getAuthToken, refund } from "../services/paymobService.js";

export const refundPayment = async (req, res) => {
  const intent = await PaymentIntent.findOne({ orderId: req.body.orderId });
  if (!intent || intent.status !== "paid")
    return res.status(400).json({ message: "Invalid refund" });

  const token = await getAuthToken();
  await refund(token, intent.paymobTxnId, intent.amountCents);

  intent.status = "refunded";
  intent.refundedAt = new Date();
  await intent.save();

  await Order.findByIdAndUpdate(intent.orderId, { status: "refunded" });
  res.json({ ok: true });
};
