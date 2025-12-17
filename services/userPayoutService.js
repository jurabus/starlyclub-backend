import axios from "axios";
import Customer from "../models/Customer.js";

export const runUserTapWithdrawals = async () => {
  const users = await Customer.find({
    "withdrawalRequests.status": "pending",
    "withdrawalRequests.method": "tap",
  });

  for (const user of users) {
    for (const w of user.withdrawalRequests) {
      if (w.status !== "pending" || w.method !== "tap") continue;

      try {
        w.status = "processing";

        const reference = `USER-${Date.now()}`;

        await axios.post(
          "https://api.tap.company/v2/transfers",
          {
            amount: w.amount,
            currency: "SAR",
            destination: { id: w.tapDestinationId },
            reference,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        w.status = "paid";
        w.reference = reference;
        w.processedAt = new Date();
      } catch (e) {
        w.status = "failed";
        w.errorMessage = e.message;
      }
    }

    await user.save();
  }
};
