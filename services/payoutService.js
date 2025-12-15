import Provider from "../models/Provider.js";
import ProviderEarning from "../models/ProviderEarning.js";
import PayoutLog from "../models/PayoutLog.js";
import mongoose from "mongoose";

const MIN_PAYOUT_AMOUNT = 50;

export const runAutoPayouts = async () => {
  console.log("🔄 Running auto payouts...");

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
      const earnings = await ProviderEarning.find(
        { providerId: provider._id, status: "pending" },
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

      if (totalAmount < MIN_PAYOUT_AMOUNT) {
        await session.endSession();
        continue;
      }

      const gateway =
        provider.tabbyOnboardingStatus === "verified"
          ? "tabby"
          : "tamara";

      const reference = `AUTO-${Date.now()}`;

      // ✅ Mark earnings paid
      await ProviderEarning.updateMany(
        { _id: { $in: earnings.map(e => e._id) } },
        {
          status: "paid",
          paidAt: new Date(),
          payoutRef: reference,
        },
        { session }
      );

      // 🧾 GLOBAL ADMIN LOG
      await PayoutLog.create(
        [
          {
            providerId: provider._id,
            providerName: provider.name,
            amount: totalAmount,
            gateway,
            status: "paid",
            earningsCount: earnings.length,
            periodStart: earnings[0].createdAt,
            periodEnd: earnings[earnings.length - 1].createdAt,
            reference,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      console.log(`✅ Paid ${provider.name} → SR ${totalAmount}`);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      await PayoutLog.create({
        providerId: provider._id,
        providerName: provider.name,
        amount: 0,
        gateway: "manual",
        status: "failed",
        errorMessage: err.message,
      });

      console.error(`❌ Payout failed for ${provider.name}`, err);
    }
  }

  console.log("🏁 Auto payout completed");
};
