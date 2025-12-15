import axios from "axios";
import PaymentIntent from "../models/PaymentIntent.js";
import Provider from "../models/Provider.js";

export const createTapPayment = async (req, res) => {
  try {
    const { amount, type, providerId } = req.body;

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
  providerId,
  userId: req.body.userId || null,
  sessionId: req.body.sessionId || null,
});


    const payload = {
      amount,
      currency: "SAR",
      customer: { first_name: "Starly User" },
      source: { id: "src_all" },
      redirect: { url: "https://starlyclub.web.app/payment-success" },
      metadata: { paymentIntentId: intent._id.toString() },
    };

    // Split payment if provider purchase
    if (provider) {
      payload.destinations = [
        {
          id: provider.tapSubMerchantId,
          amount: amount,
        },
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
    res.status(500).json({ message: err.message });
  }
};

export const createTabbyPayment = async (req, res) => {
  const { amount, providerId } = req.body;

  const provider = await Provider.findById(providerId);
  if (!provider?.tabbyMerchantId) {
    return res
      .status(400)
      .json({ message: "Provider is not Tabby-enabled" });
  }

  const intent = await PaymentIntent.create({
  amount,
  gateway: "tabby",
  type: "provider_purchase",
  providerId,
  userId: req.body.userId || null,
  sessionId: req.body.sessionId || null,
});


  res.json({
    paymentUrl: `https://checkout.tabby.ai/?amount=${amount}&ref=${intent._id}`,
  });
};


export const createTamaraPayment = async (req, res) => {
  const { amount, providerId } = req.body;

  const provider = await Provider.findById(providerId);
  if (!provider?.tamaraMerchantId) {
    return res
      .status(400)
      .json({ message: "Provider is not Tamara-enabled" });
  }

  const intent = await PaymentIntent.create({
  amount,
  gateway: "tamara",
  type: "provider_purchase",
  providerId,
  userId: req.body.userId || null,
  sessionId: req.body.sessionId || null,
});


  res.json({
    paymentUrl: `https://checkout.tamara.co/?amount=${amount}&ref=${intent._id}`,
  });
};


export const tapOnboardingCallback = async (req, res) => {
  try {
    const { providerId, sub_merchant_id } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).send("Provider not found");

    provider.tapSubMerchantId = sub_merchant_id;
    provider.tapOnboardingStatus = "verified";
    await provider.save();

    res.send("Onboarding completed successfully");
  } catch (e) {
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
