// routes/voucherPurchaseRoutes.js
import express from "express";
import Voucher from "../models/Voucher.js";
import Provider from "../models/Provider.js";
import Customer from "../models/Customer.js";

const router = express.Router();

/**
 * POST /api/vouchers/purchase
 * Body: { userId, providerId, amount }
 */
router.post("/purchase", async (req, res) => {
  try {
    const { userId, providerId, amount } = req.body;

    if (!userId || !providerId || !amount)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const provider = await Provider.findById(providerId);
    if (!provider)
      return res.status(404).json({ success: false, message: "Provider not found" });

    const user = await Customer.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // Provider discount
    const discount = provider.voucherDiscountPercent ?? 0;
    const finalPrice = amount - (amount * discount) / 100;

    if (user.walletBalance < finalPrice)
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });

    // Deduct cost
    user.walletBalance -= finalPrice;
    await user.save();

    // Create user-owned voucher
    const voucher = await Voucher.create({
      provider: provider._id,
      providerName: provider.name,
      faceValue: amount,
      price: finalPrice,
      currency: "SR",
      name: `${provider.name} ${amount} SR Voucher`,
      logoUrl: provider.logoUrl || "",
      isActive: true,
      featured: false,

      // User-specific
      status: "unused",
      purchasedAt: new Date(),
      redeemedAt: null,
    });

    res.status(201).json({ success: true, voucher });
  } catch (err) {
    console.error("Voucher purchase error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
