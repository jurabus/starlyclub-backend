import PaymentIntent from "../models/PaymentIntent.js";
import User from "../models/User.js";
import {
  getAuthToken,
  createOrder,
  createPaymentKey,
} from "../services/paymobService.js";

const MAP = {
  card: process.env.PAYMOB_INTEGRATION_ID_CARD,
  apple_pay: process.env.PAYMOB_INTEGRATION_ID_APPLEPAY,
  wallet: process.env.PAYMOB_INTEGRATION_ID_WALLET,
  fawry: process.env.PAYMOB_INTEGRATION_ID_FAWRY,
};

export const initiatePayment = async (req, res) => {
  const { paymentIntentId, method } = req.body;
  const userId = req.user.id;

  const intent = await PaymentIntent.findById(paymentIntentId);
  if (!intent) {
    return res.status(404).json({ message: "PaymentIntent not found" });
  }

  if (intent.status !== "pending") {
    return res.json({ paymentKey: intent.paymobPaymentKey });
  }

  const user = await User.findById(userId);
  const authToken = await getAuthToken();

  const order = await createOrder(authToken, intent.amountCents);

  const paymentKey = await createPaymentKey({
    authToken,
    orderId: order.id,
    amountCents: intent.amountCents,
    customer: user,
    integrationId: MAP[method],
    tokenize: intent.type !== "membership_purchase" ? false : true,
  });

  intent.paymobOrderId = order.id;
  intent.paymobPaymentKey = paymentKey;
  await intent.save();

  res.json({ paymentKey });
};
