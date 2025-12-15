import cron from "node-cron";
import { runAutoPayouts } from "../services/payoutService.js";

const ENABLE_PAYOUT_CRON = process.env.ENABLE_PAYOUT_CRON === "true";
const CRON_TZ = process.env.CRON_TZ || "Africa/Cairo";

// Run daily at 3 AM
if (ENABLE_PAYOUT_CRON) {
  cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("⏰ Auto payout cron started");

      try {
        await runAutoPayouts();
        console.log("✅ Auto payout cron finished successfully");
      } catch (err) {
        console.error("❌ Auto payout cron failed:", err);
      }
    },
    { timezone: CRON_TZ }
  );

  console.log("✅ Payout cron ENABLED");
} else {
  console.log("ℹ️ Payout cron DISABLED (ENABLE_PAYOUT_CRON != true)");
}
