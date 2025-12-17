import cron from "node-cron";
import { runUserTapWithdrawals } from "../services/userPayoutService.js";

cron.schedule("*/15 * * * *", async () => {
  console.log("💸 Running user Tap withdrawals");
  await runUserTapWithdrawals();
});
