import Provider from "../models/Provider.js";
import ProviderEarning from "../models/ProviderEarning.js";
import mongoose from "mongoose";

const MIN_PAYOUT_AMOUNT = 50; // SR safety threshold

/**
 * Auto payout providers
 * - Tabby / Tamara ready
 * - Idempotent
 * - Admin-loggable
 */
export const runAutoPayouts = async () => {
  console.log("🔄 Scanning providers for payouts...");

  const providers = await Provider.find({
    $or: [
      { tabbyOnboardingStatus: "verified" },
      { tamaraOnboardingStatus: "verified" },
    ],
  });

  for (const provider of providers) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 🔒 Lock only unpaid earnings
      const earnings = await ProviderEarning.find(
        {
          providerId: provider._id,
          status: "pending",
        },
        null,
        { session }
      );

      if (!earnings.length) {
        await session.endSession();
        continue;
      }

      const totalAmount = earnings.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );

      // ⛔ Minimum payout protection
      if (totalAmount < MIN_PAYOUT_AMOUNT) {
        await session.endSession();
        continue;
      }

      console.log(
        `💸 Paying provider "${provider.name}" → SR ${totalAmount}`
      );

      /**
       * 🚀 PAYOUT EXECUTION (future-ready)
       * Replace this block with:
       * - Bank API
       * - Tap / Stripe / Wise / Payoneer
       */
      const payoutResult = {
        success: true,
        reference: `AUTO-${Date.now()}`,
        gateway:
          provider.tabbyOnboardingStatus === "verified"
            ? "tabby"
            : "tamara",
      };

      if (!payoutResult.success) {
        throw new Error("Payout gateway failed");
      }

      // ✅ Mark earnings as paid
      await ProviderEarning.updateMany(
        { _id: { $in: earnings.map((e) => e._id) } },
        {
          status: "paid",
          paidAt: new Date(),
          payoutRef: payoutResult.reference,
        },
        { session }
      );

      // 🧾 Admin payout log (stored on provider)
      provider.payoutHistory = provider.payoutHistory || [];
      provider.payoutHistory.push({
        amount: totalAmount,
        paidAt: new Date(),
        gateway: payoutResult.gateway,
        reference: payoutResult.reference,
        earningsCount: earnings.length,
      });

      await provider.save({ session });

      await session.commitTransaction();
      session.endSession();

      console.log(
        `✅ Provider "${provider.name}" paid successfully`
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      console.error(
        `❌ Payout failed for provider "${provider.name}":`,
        err.message
      );
    }
  }

  console.log("🏁 Auto payout scan completed");
};
