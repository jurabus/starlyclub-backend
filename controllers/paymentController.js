import axios from "axios";
import PaymentIntent from "../models/PaymentIntent.js";
import Provider from "../models/Provider.js";


const isTapConfigured = () =>
  typeof process.env.TAP_SECRET_KEY === "string" &&
  process.env.TAP_SECRET_KEY.trim().length > 10;

if (!process.env.TAP_SECRET_KEY) {
  console.error("❌ TAP_SECRET_KEY is missing from environment variables");
}

/* =========================================================
   TAP
========================================================= */
export const createTapPayment = async (req, res) => {
  try {
    const {
      amount,
      type,
      providerId,
      userId,
      sessionId,
      membershipPaymentId,
    } = req.body;

    // -------------------------------
    // 🧪 MOCK MODE (Tap not configured)
    // -------------------------------
    if (!isTapConfigured()) {
      const intent = await PaymentIntent.create({
        amount,
        type,
        gateway: "tap",
        providerId: providerId || null,
        userId: userId || null,
        sessionId: sessionId || null,
        membershipPaymentId: membershipPaymentId || null,
        status: "paid", // 🔥 auto-paid
      });

      return res.json({
        paymentUrl: `https://starlyclub.web.app/mock-payment-success?intent=${intent._id}`,
        mock: true,
      });
    }

    // -------------------------------
    // 🔴 REAL TAP MODE
    // -------------------------------
    let provider = null;

    if (type === "provider_purchase") {
      provider = await Provider.findById(providerId);
      if (!provider?.tapSubMerchantId) {
        return res.status(400).json({ message: "Provider payout not enabled" });
      }
    }

    const intent = await PaymentIntent.create({
      amount,
      type,
      gateway: "tap",
      providerId: provider ? providerId : null,
      userId: userId || null,
      sessionId: sessionId || null,
      membershipPaymentId: membershipPaymentId || null,
    });

    const payload = {
      amount,
      currency: "SAR",
      customer: { first_name: "Starly User" },
      source: { id: "src_all" },
      redirect: { url: "https://starlyclub.web.app/payment-success" },
      metadata: {
        paymentIntentId: intent._id.toString(),
      },
    };

    if (provider) {
      payload.destinations = [
        { id: provider.tapSubMerchantId, amount },
      ];
    }

    const response = await axios.post(
      "https://api.tap.company/v2/charges",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    intent.externalPaymentId = response.data.id;
    await intent.save();

    res.json({ paymentUrl: response.data.transaction.url });
  } catch (err) {
    console.error("Tap create error:", err.response?.data || err.message);
    res.status(500).json({ message: "Tap payment initialization failed" });
  }
};


/* =========================================================
   TABBY
========================================================= */
export const createTabbyPayment = async (req, res) => {
  const {
    amount,
    type,
    providerId,
    userId,
    sessionId,
    membershipPaymentId,
  } = req.body;

  let provider = null;

  if (type === "provider_purchase") {
    provider = await Provider.findById(providerId);
    if (!provider?.tabbyMerchantId) {
      return res
        .status(400)
        .json({ message: "Provider is not Tabby-enabled" });
    }
  }

  const intent = await PaymentIntent.create({
    amount,
    gateway: "tabby",
    type,
    providerId: provider ? providerId : null,
    userId: userId || null,
    sessionId: sessionId || null,
    membershipPaymentId: membershipPaymentId || null,
  });

  res.json({
    paymentUrl: `https://checkout.tabby.ai/?amount=${amount}&ref=${intent._id}`,
  });
};

/* =========================================================
   TAMARA
========================================================= */
export const createTamaraPayment = async (req, res) => {
  const {
    amount,
    type,
    providerId,
    userId,
    sessionId,
    membershipPaymentId,
  } = req.body;

  let provider = null;

  if (type === "provider_purchase") {
    provider = await Provider.findById(providerId);
    if (!provider?.tamaraMerchantId) {
      return res
        .status(400)
        .json({ message: "Provider is not Tamara-enabled" });
    }
  }

  const intent = await PaymentIntent.create({
    amount,
    gateway: "tamara",
    type,
    providerId: provider ? providerId : null,
    userId: userId || null,
    sessionId: sessionId || null,
    membershipPaymentId: membershipPaymentId || null,
  });

  res.json({
    paymentUrl: `https://checkout.tamara.co/?amount=${amount}&ref=${intent._id}`,
  });
};

/* =========================================================
   ONBOARDING CALLBACKS (UNCHANGED)
========================================================= */
export const tapOnboardingCallback = async (req, res) => {
  try {
    const { providerId, sub_merchant_id } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).send("Provider not found");

    provider.tapSubMerchantId = sub_merchant_id;
    provider.tapOnboardingStatus = "verified";
    await provider.save();

    res.send("Onboarding completed successfully");
  } catch {
    res.status(500).send("Onboarding error");
  }
};

export const tabbyOnboardingCallback = async (req, res) => {
  try {
    const { providerId, merchant_id } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).send("Provider not found");

    provider.tabbyMerchantId = merchant_id;
    provider.tabbyOnboardingStatus = "verified";
    await provider.save();

    res.send("Tabby onboarding completed");
  } catch {
    res.status(500).send("Tabby onboarding failed");
  }
};

export const tamaraOnboardingCallback = async (req, res) => {
  try {
    const { providerId, merchant_id } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).send("Provider not found");

    provider.tamaraMerchantId = merchant_id;
    provider.tamaraOnboardingStatus = "verified";
    await provider.save();

    res.send("Tamara onboarding completed");
  } catch {
    res.status(500).send("Tamara onboarding failed");
  }
};
