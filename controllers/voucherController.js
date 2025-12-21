import Voucher from "../models/Voucher.js";
import Provider from "../models/Provider.js";
import Customer from "../models/Customer.js";
import crypto from "crypto";
import PaymentIntent from "../models/PaymentIntent.js";

/* ============================================================
   CREATE VOUCHER PAYMENT (PAYMOB / WALLET / WEBHOOK SAFE)
   ============================================================ */
export const createVoucherPayment = async (req, res) => {
  try {
    const { userId, providerId, amount, method } = req.body;

    if (!userId || !providerId || !amount || !method) {
      return res.status(400).json({ message: "Missing data" });
    }

    const provider = await Provider.findById(providerId);
    if (!provider)
      return res.status(404).json({ message: "Provider not found" });

    const discountPercent = provider.voucherDiscountPercent || 0;
    const finalPrice = Math.round(
      amount - (amount * discountPercent) / 100
    );

    // 🔒 Create PaymentIntent (idempotent via orderId)
    const intent = await PaymentIntent.create({
      userId,
      amountCents: finalPrice * 100,
      currency: "EGP",
      type: "provider_purchase",
      metadata: {
        providerId,
        faceValue: amount,
        discountPercent,
      },
      status: "pending",
    });

    // 🔁 Frontend will call /api/payments/initiate next
    res.json({
      success: true,
      paymentIntentId: intent._id,
    });
  } catch (e) {
    console.error("❌ createVoucherPayment error:", e.message);
    res.status(500).json({ message: "Voucher payment failed" });
  }
};

/* ============================================================
   LEGACY WALLET PURCHASE (NO PAYMOB)
   ============================================================ */
export const purchaseVoucher = async (req, res) => {
  try {
    const { userId, providerId, amount } = req.body;

    if (!userId || !providerId || !amount)
      return res.status(400).json({ success: false, message: "Missing data" });

    const provider = await Provider.findById(providerId);
    if (!provider)
      return res.status(404).json({ success: false, message: "Provider not found" });

    const user = await Customer.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const discountPercent = provider.voucherDiscountPercent || 0;
    const finalPrice = Math.round(
      amount - (amount * discountPercent) / 100
    );

    if (user.walletBalance < finalPrice)
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });

    user.walletBalance -= finalPrice;
    await user.save();

    const purchasedAt = new Date();
    const validUntil = new Date(purchasedAt);
    validUntil.setDate(validUntil.getDate() + 28);

    const voucher = await Voucher.create({
      provider: provider._id,
      providerName: provider.name,
      logoUrl: provider.logoUrl || "",
      currency: "SR",
      faceValue: amount,
      price: finalPrice,
      discountPercent,
      userId,
      status: "unused",
      purchasedAt,
      validUntil,
      name: `${provider.name} Voucher ${amount} SR`,
    });

    res.status(201).json({
      success: true,
      voucher,
      newBalance: user.walletBalance,
    });
  } catch (err) {
    console.error("❌ Wallet voucher error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
/* ============================================================
   ADMIN LIST VOUCHERS (READ ONLY)
   ============================================================ */
export const adminListVouchers = async (_req, res) => {
  try {
    const vouchers = await Voucher.find()
      .populate("provider", "name logoUrl")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, vouchers });
  } catch (err) {
    console.error("❌ adminListVouchers error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
/* ============================================================
   USER: LIST OWN VOUCHERS
   ============================================================ */
export const getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId" });
    }

    const vouchers = await Voucher.find({ userId })
      .populate("provider", "name logoUrl")
      .sort({ createdAt: -1 });

    res.json({ success: true, vouchers });
  } catch (e) {
    console.error("❌ getUserVouchers error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};
