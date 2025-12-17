import express from "express";
import Customer from "../models/Customer.js";
import axios from "axios";

const router = express.Router();



/* ===============================
   AUTHORIZE WITHDRAWAL
================================ */
router.post("/withdrawals/authorize", async (req, res) => {
  try {
    const { userId, withdrawalId } = req.body;

    const user = await Customer.findById(userId);
    if (!user) throw new Error("User not found");

    const w = user.withdrawalRequests.id(withdrawalId);
    if (!w || w.status !== "pending")
      throw new Error("Invalid withdrawal");

    w.status = "authorized";
    w.authorizedAt = new Date();

    // 🔁 Tap auto payout
    if (w.method === "tap") {
      w.status = "processing";

      const reference = `ADMIN-${Date.now()}`;

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
    }

    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

/* ===============================
   LIST ALL PENDING WITHDRAWALS
================================ */
router.get("/withdrawals", async (req, res) => {
  try {
    const users = await Customer.find(
      { "withdrawalRequests.status": "pending" },
      { name: 1, email: 1, withdrawalRequests: 1 }
    ).lean();

    const withdrawals = [];

    users.forEach((u) => {
      u.withdrawalRequests.forEach((w) => {
        if (w.status === "pending") {
          withdrawals.push({
            _id: w._id,
            userId: u._id,
            userName: u.name,
            email: u.email,
            amount: w.amount,
            method: w.method,
            requestedAt: w.requestedAt,
            tapDestinationId: w.tapDestinationId,
          });
        }
      });
    });

    res.json({ success: true, withdrawals });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
