import Voucher from "../models/Voucher.js";
import Provider from "../models/Provider.js";
import Customer from "../models/Customer.js";
import crypto from "crypto";
import PaymentIntent from "../models/PaymentIntent.js";
import {
  createTapPayment,
  createTabbyPayment,
  createTamaraPayment,
} from "./paymentController.js";
import { isTapConfigured } from "../utils/isTapConfigured.js";

/* ============================================================
   🔹 CREATE VOUCHER PAYMENT (GATEWAY / MOCK / WEBHOOK SAFE)
   ============================================================ */
export const createVoucherPayment = async (req, res) => {
  try {
    const { userId, providerId, amount, gateway } = req.body;

    if (!userId || !providerId || !amount || !gateway) {
      return res.status(400).json({ message: "Missing data" });
    }

    const provider = await Provider.findById(providerId);
    if (!provider)
      return res.status(404).json({ message: "Provider not found" });

    const discountPercent = provider.voucherDiscountPercent || 0;
    const finalPrice = Math.round(amount - (amount * discountPercent) / 100);

    /* ---------------- PAYMENT INTENT ---------------- */
    const intent = await PaymentIntent.create({
      userId,
      providerId,
      amount: finalPrice,
      currency: "SAR",
      gateway,
      type: "provider_purchase",
      voucherPayload: {
        faceValue: amount,
        discountPercent,
        providerName: provider.name,
        logoUrl: provider.logoUrl || "",
      },
      status: "pending",
    });

    req.body.amount = finalPrice;
    req.body.paymentIntentId = intent._id;

    /* ---------------- MOCK MODE ---------------- */
    if (gateway === "tap" && !isTapConfigured()) {
      const purchasedAt = new Date();
      const validUntil = new Date(purchasedAt);
      validUntil.setDate(validUntil.getDate() + 28);

      await Voucher.create({
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

      intent.status = "paid";
      intent.paidAt = new Date();
      await intent.save();

      return res.json({
        mocked: true,
        paymentUrl: "MOCK_SUCCESS",
      });
    }

    /* ---------------- REAL GATEWAYS ---------------- */
    if (gateway === "tap") return createTapPayment(req, res);
    if (gateway === "tabby") return createTabbyPayment(req, res);
    if (gateway === "tamara") return createTamaraPayment(req, res);

    return res.status(400).json({ message: "Invalid gateway" });
  } catch (e) {
    console.error("Voucher payment error:", e);
    res.status(500).json({ message: "Voucher payment failed" });
  }
};

/* ============================================================
   🔹 LEGACY WALLET PURCHASE (KEPT FOR BACKWARD COMPATIBILITY)
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
    const finalPrice = Math.round(amount - (amount * discountPercent) / 100);

    if (user.walletBalance < finalPrice)
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });

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
    console.error("❌ Purchase voucher error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   🔹 LIST USER VOUCHERS
   ============================================================ */
export const getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId)
      return res.status(400).json({ success: false, message: "Missing userId" });

    const vouchers = await Voucher.find({ userId })
      .populate("provider", "name logoUrl")
      .sort({ createdAt: -1 });

    res.json({ success: true, vouchers });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ============================================================
   🔹 ADMIN LIST
   ============================================================ */
export const adminListVouchers = async (_req, res) => {
  try {
    const vouchers = await Voucher.find()
      .populate("provider", "name logoUrl")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   🔹 ISSUE QR
   ============================================================ */
export const issueVoucherQR = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher)
      return res.status(404).json({ success: false, message: "Voucher not found" });

    if (voucher.validUntil && new Date() > voucher.validUntil) {
      voucher.status = "expired";
      await voucher.save();
      return res.status(400).json({
        success: false,
        message: "Voucher expired",
      });
    }

    if (voucher.status !== "unused") {
      return res.status(400).json({
        success: false,
        message: "Only unused vouchers can generate QR",
      });
    }

    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 1000);

    voucher.currentQrCode = code;
    voucher.qrIssuedAt = new Date();
    voucher.qrExpiresAt = expiresAt;
    await voucher.save();

    const proto =
      (req.headers["x-forwarded-proto"] || "").split(",")[0] || req.protocol;
    const host = req.get("host");

    res.json({
      success: true,
      code,
      expiresAt,
      validationUrl: `${proto}://${host}/api/vouchers/qr/validate/${code}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   🔹 VALIDATE QR
   ============================================================ */
export const validateVoucherQR = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const now = new Date();

    const voucher = await Voucher.findOne({
      currentQrCode: code,
      status: "unused",
    }).populate("provider");

    if (!voucher)
      return res.status(404).json({ success: false, message: "Invalid QR" });

    if (!voucher.qrExpiresAt || voucher.qrExpiresAt < now)
      return res.status(400).json({ success: false, message: "QR expired" });

    if (voucher.validUntil && now > voucher.validUntil) {
      voucher.status = "expired";
      await voucher.save();
      return res.status(400).json({ success: false, message: "Voucher expired" });
    }

    voucher.status = "redeemed";
    voucher.redeemedAt = now;
    await voucher.save();

    res.json({
      success: true,
      message: "Voucher validated",
      voucher,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
