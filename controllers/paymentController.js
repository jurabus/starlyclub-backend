// controllers/paymentController.js
import PaymentIntent from "../models/PaymentIntent.js";
import Customer from "../models/Customer.js";
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
  try {
    const { paymentIntentId, method } = req.body;
    const userId = req.user.id;

    const intent = await PaymentIntent.findById(paymentIntentId);
    if (!intent) {
      return res.status(404).json({ message: "PaymentIntent not found" });
    }

    // 🔒 Idempotency
    if (intent.status !== "pending" && intent.paymobPaymentKey) {
      return res.json({ paymentKey: intent.paymobPaymentKey });
    }

    const customer = await Customer.findById(userId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const authToken = await getAuthToken();

    const order = await createOrder(authToken, intent.amountCents);

    const paymentKey = await createPaymentKey({
      authToken,
      orderId: order.id,
      amountCents: intent.amountCents,
      customer,
      integrationId: MAP[method],
      tokenize: intent.type === "subscription_charge", // ✅ correct
    });

    intent.paymobOrderId = order.id;
    intent.paymobPaymentKey = paymentKey;
    await intent.save();

    res.json({ paymentKey });
  } catch (e) {
    console.error("❌ initiatePayment error:", e.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};
