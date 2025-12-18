import axios from "axios";
import PaymentIntent from "../models/PaymentIntent.js";
import Provider from "../models/Provider.js";
import { finalizePaymentOnce } from "../utils/paymentFinalizer.js";

/* =========================================================
   ENV HELPERS
========================================================= */
const isTapConfigured = () =>
  typeof process.env.TAP_SECRET_KEY === "string" &&
  process.env.TAP_SECRET_KEY.trim().length > 10;

const isTabbyConfigured = () =>
  typeof process.env.TABBY_PUBLIC_KEY === "string" &&
  process.env.TABBY_PUBLIC_KEY.trim().length > 5;

const isTamaraConfigured = () =>
  typeof process.env.TAMARA_API_KEY === "string" &&
  process.env.TAMARA_API_KEY.trim().length > 5;

if (!process.env.TAP_SECRET_KEY) {
  console.warn("⚠️ TAP_SECRET_KEY not set → Tap mock mode enabled");
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
      voucherPayload, // <-- explicitly destructure
    } = req.body;

    // 🧪 MOCK MODE (Tap not configured)
    if (!isTapConfigured()) {
      const intent = await PaymentIntent.create({
        amount,
        type,
        gateway: "tap",
        providerId: providerId || null,
        userId: userId || null,
        sessionId: sessionId || null,
        membershipPaymentId: membershipPaymentId || null,

        // ✅ ONLY attach if it exists
        ...(voucherPayload ? { voucherPayload } : {}),

        status: "pending",
      });

      // ✅ Finalize (creates ORDER or VOUCHER safely)
      await finalizePaymentOnce(intent);

      return res.json({
        mocked: true,
        paymentIntentId: intent._id,
      });
    }

    /* ================= REAL TAP MODE ================= */

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
      ...(voucherPayload ? { voucherPayload } : {}),
    });

    const payload = {
      amount,
      currency: "SAR",
      customer: { first_name: "Starly User" },
      source: { id: "src_all" },
      redirect: { url: "https://starlyclub.web.app/payment-success" },
      metadata: { paymentIntentId: intent._id.toString() },
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

  // 🧪 FALLBACK TO MOCK MODE (DEV / SAFETY)
  try {
    const intent = await PaymentIntent.create({
      amount: req.body.amount,
      type: req.body.type,
      gateway: "tap",
      providerId: req.body.providerId || null,
      userId: req.body.userId || null,
      sessionId: req.body.sessionId || null,
      membershipPaymentId: req.body.membershipPaymentId || null,
      ...(req.body.voucherPayload ? { voucherPayload: req.body.voucherPayload } : {}),
      status: "pending",
    });

    await finalizePaymentOnce(intent);

    return res.json({
      mocked: true,
      paymentIntentId: intent._id,
      fallback: true,
    });
  } catch (fallbackErr) {
    console.error("Tap fallback mock failed:", fallbackErr.message);
    return res.status(500).json({
      message: "Tap payment failed (fallback mock also failed)",
    });
  }
}

};


/* =========================================================
   TABBY
========================================================= */
export const createTabbyPayment = async (req, res) => {
  try {
    const {
      amount,
      type,
      providerId,
      userId,
      sessionId,
      membershipPaymentId,
      voucherPayload,
    } = req.body;

    /* -------------------------------
       🧪 MOCK MODE
    -------------------------------- */
    if (!isTabbyConfigured()) {
      const intent = await PaymentIntent.create({
        amount,
        type,
        gateway: "tabby",
        providerId: providerId || null,
        userId: userId || null,
        sessionId: sessionId || null,
        membershipPaymentId: membershipPaymentId || null,
        voucherPayload: voucherPayload || null,
        status: "pending",
      });

      await finalizePaymentOnce(intent);

      return res.json({
        mocked: true,
        paymentIntentId: intent._id,
      });
    }

    /* -------------------------------
       🔴 REAL TABBY MODE
    -------------------------------- */
    let provider = null;

    if (type === "provider_purchase") {
      provider = await Provider.findById(providerId);
      if (!provider?.tabbyMerchantId) {
        return res.status(400).json({
          message: "Provider is not Tabby-enabled",
        });
      }
    }

    const intent = await PaymentIntent.create({
      amount,
      type,
      gateway: "tabby",
      providerId: provider ? providerId : null,
      userId: userId || null,
      sessionId: sessionId || null,
      membershipPaymentId: membershipPaymentId || null,
      voucherPayload: voucherPayload || null,
    });

    res.json({
      paymentUrl: `https://checkout.tabby.ai/?amount=${amount}&ref=${intent._id}`,
    });
  } catch (err) {
    console.error("❌ Tabby error:", err.message);
    res.status(500).json({ message: "Tabby payment failed" });
  }
};

/* =========================================================
   TAMARA
========================================================= */
export const createTamaraPayment = async (req, res) => {
  try {
    const {
      amount,
      type,
      providerId,
      userId,
      sessionId,
      membershipPaymentId,
      voucherPayload,
    } = req.body;

    /* -------------------------------
       🧪 MOCK MODE
    -------------------------------- */
    if (!isTamaraConfigured()) {
      const intent = await PaymentIntent.create({
        amount,
        type,
        gateway: "tamara",
        providerId: providerId || null,
        userId: userId || null,
        sessionId: sessionId || null,
        membershipPaymentId: membershipPaymentId || null,
        voucherPayload: voucherPayload || null,
        status: "pending",
      });

      await finalizePaymentOnce(intent);

      return res.json({
        mocked: true,
        paymentIntentId: intent._id,
      });
    }

    /* -------------------------------
       🔴 REAL TAMARA MODE
    -------------------------------- */
    let provider = null;

    if (type === "provider_purchase") {
      provider = await Provider.findById(providerId);
      if (!provider?.tamaraMerchantId) {
        return res.status(400).json({
          message: "Provider is not Tamara-enabled",
        });
      }
    }

    const intent = await PaymentIntent.create({
      amount,
      type,
      gateway: "tamara",
      providerId: provider ? providerId : null,
      userId: userId || null,
      sessionId: sessionId || null,
      membershipPaymentId: membershipPaymentId || null,
      voucherPayload: voucherPayload || null,
    });

    res.json({
      paymentUrl: `https://checkout.tamara.co/?amount=${amount}&ref=${intent._id}`,
    });
  } catch (err) {
    console.error("❌ Tamara error:", err.message);
    res.status(500).json({ message: "Tamara payment failed" });
  }
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

    res.send("Tap onboarding completed");
  } catch {
    res.status(500).send("Tap onboarding error");
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
