import Provider from "../models/Provider.js";
import ProviderEarning from "../models/ProviderEarning.js";
import axios from "axios";

/**
 * Auto payout providers (Tabby / Tamara)
 * Runs via cron
 */
export const runAutoPayouts = async () => {
  const providers = await Provider.find({
    $or: [
      { tabbyOnboardingStatus: "verified" },
      { tamaraOnboardingStatus: "verified" },
    ],
  });

  for (const provider of providers) {
    const earnings = await ProviderEarning.find({
      providerId: provider._id,
      status: "pending",
    });

    if (!earnings.length) continue;

    const totalAmount = earnings.reduce((s, e) => s + e.amount, 0);

    // ⛔ Safety threshold
    if (totalAmount < 50) continue; // minimum payout SR 50

    // 🔁 PAYOUT (manual bank / future API)
    // 👉 Replace with real bank transfer API later
    console.log(
      `💸 Paying provider ${provider.name} → SR ${totalAmount}`
    );

    await ProviderEarning.updateMany(
      { _id: { $in: earnings.map(e => e._id) } },
      { status: "paid", paidAt: new Date() }
    );
  }
};
