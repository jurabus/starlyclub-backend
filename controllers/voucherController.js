import Voucher from "../models/Voucher.js";
import Provider from "../models/Provider.js";
import Customer from "../models/Customer.js";
import crypto from "crypto";

/* ==========================================================
   1) USER PURCHASES A VOUCHER
   ========================================================== */
export const purchaseVoucher = async (req, res) => {
  try {
    const { userId, providerId, amount } = req.body;

    if (!userId || !providerId || !amount)
      return res
        .status(400)
        .json({ success: false, message: "Missing data" });

    const provider = await Provider.findById(providerId);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });

    const user = await Customer.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const disc = provider.voucherDiscountPercent || 0;
    const price = amount - (amount * disc) / 100;
    const finalPrice = Math.round(price);

    if (user.walletBalance < finalPrice)
      return res
        .status(400)
        .json({ success: false, message: "Insufficient wallet balance" });

    // Deduct from wallet
    user.walletBalance -= finalPrice;
    await user.save();

    const voucher = await Voucher.create({
      provider: provider._id,
      providerName: provider.name,
      logoUrl: provider.logoUrl || "",
      currency: "SR",
      faceValue: amount,
      price: finalPrice,
      discountPercent: disc,
      userId: userId,
      status: "unused",
      name: `${provider.name} Voucher ${amount} SR`,
    });

    res.status(201).json({
      success: true,
      voucher,
      newBalance: user.walletBalance,
    });
  } catch (err) {
    console.error("❌ purchaseVoucher error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ==========================================================
   2) LIST VOUCHERS FOR A USER
   ========================================================== */
export const getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "Missing userId" });

    const vouchers = await Voucher.find({ userId })
      .sort({ purchasedAt: -1 })
      .lean();

    res.json({ success: true, vouchers });
  } catch (err) {
    console.error("❌ getUserVouchers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ==========================================================
   3) ADMIN LISTS ALL VOUCHERS
   ========================================================== */
export const adminListVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find()
      .populate("provider", "name logoUrl")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, vouchers });
  } catch (err) {
    console.error("❌ adminListVouchers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ==========================================================
   4) USER REQUESTS QR FOR A VOUCHER
   ========================================================== */
export const issueVoucherQR = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await Voucher.findById(id);
    if (!voucher)
      return res
        .status(404)
        .json({ success: false, message: "Voucher not found" });

    if (voucher.status !== "unused")
      return res.status(400).json({
        success: false,
        message: "Only unused vouchers can generate QR",
      });

    const TTL = 90; // 90 sec
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + TTL * 1000);

    voucher.currentQrCode = code;
    voucher.qrIssuedAt = new Date();
    voucher.qrExpiresAt = expiresAt;
    await voucher.save();

    // FIX: use correct voucher validate endpoint
    const proto =
      (req.headers["x-forwarded-proto"] || "").split(",")[0] ||
      req.protocol;
    const host = req.get("host");

    const validationUrl = `${proto}://${host}/api/vouchers/qr/validate/${code}`;

    res.json({
      success: true,
      code,
      expiresAt,
      validationUrl,
    });
  } catch (err) {
    console.error("❌ issueVoucherQR error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ==========================================================
   5) PROVIDER SCANS & VALIDATES VOUCHER
   ========================================================== */
export const validateVoucherQR = async (req, res) => {
  try {
    const code = (req.params.code || "").trim().toUpperCase();
    const now = new Date();

    const voucher = await Voucher.findOne({
      currentQrCode: code,
      status: "unused",
      $or: [
        { qrExpiresAt: { $exists: false } },
        { qrExpiresAt: { $gt: now } },
      ],
    }).populate("provider");

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired voucher QR",
      });
    }

    voucher.status = "redeemed";
    voucher.redeemedAt = new Date();
    await voucher.save();

    res.json({
      success: true,
      message: "Voucher validated successfully",
      voucher: {
        id: voucher._id,
        faceValue: voucher.faceValue,
        price: voucher.price,
        userId: voucher.userId,
        providerName: voucher.providerName,
        provider: voucher.provider,
        redeemedAt: voucher.redeemedAt,
      },
    });
  } catch (err) {
    console.error("❌ validateVoucherQR error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
