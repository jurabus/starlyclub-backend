import cron from "node-cron";
import { runAutoPayouts } from "../services/payoutService.js";

// Every day at 3 AM
cron.schedule("0 3 * * *", async () => {
  console.log("⏰ Running auto payout job...");
  await runAutoPayouts();
});
