import express from "express";
import Voucher from "../models/Voucher.js";
import crypto from "crypto";

const router = express.Router();

/**
 * POST /api/qr/voucher/issue/:voucherId
 * Issue temporary QR (90 seconds)
 */
router.post("/issue/:voucherId", async (req, res) => {
  try {
    const { voucherId } = req.params;
    const voucher = await Voucher.findById(voucherId);
    if (!voucher)
      return res.status(404).json({ success: false, message: "Voucher not found." });

    const TTL_SECONDS = 600;

    const code = crypto.randomBytes(4).toString("hex").toUpperCase().trim();
    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);

    voucher.currentQrCode = code;
    voucher.qrExpiresAt = expiresAt;
    voucher.isRedeemed = false;
    await voucher.save();

    const proto =
      (req.headers["x-forwarded-proto"] || "").split(",")[0] ||
      req.protocol ||
      "https";
    const host = req.get("host");
    const validationUrl = `${proto}://${host}/api/qr/voucher/validate/${encodeURIComponent(code)}`;

    res.json({
      success: true,
      message: "QR issued successfully.",
      code,
      expiresAt,
      validationUrl,
    });
  } catch (err) {
    console.error("❌ Voucher QR issue error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/qr/voucher/validate/:code
 * Atomic validation and redemption
 */
router.get("/validate/:code", async (req, res) => {
  try {
    const raw = (req.params.code || "").trim().toUpperCase();
    if (!raw)
      return res.status(400).json({ success: false, message: "Missing code." });

    const now = new Date();

    const voucher = await Voucher.findOneAndUpdate(
      {
        currentQrCode: raw,
        isRedeemed: false,
        $or: [{ qrExpiresAt: { $exists: false } }, { qrExpiresAt: { $gt: now } }],
      },
      { $set: { isRedeemed: true, status: "redeemed", redeemedAt: new Date() } },
      { new: true }
    ).populate("provider");

    if (!voucher) {
      const found = await Voucher.findOne({ currentQrCode: raw }).select(
        "qrExpiresAt isRedeemed"
      );
      if (!found)
        return res.status(404).json({ success: false, message: "❌ Invalid QR code." });
      if (found.isRedeemed)
        return res.status(409).json({ success: false, message: "🚫 Voucher already redeemed." });
      if (found.qrExpiresAt && now > found.qrExpiresAt)
        return res.status(410).json({ success: false, message: "⏰ QR code expired." });
      return res.status(400).json({ success: false, message: "Cannot validate QR." });
    }

    res.json({
      success: true,
      message: "✅ Voucher validated successfully.",
      voucher: {
        id: voucher._id,
        provider: voucher.provider
          ? {
              id: voucher.provider._id,
              name: voucher.provider.name,
              logoUrl: voucher.provider.logoUrl,
            }
          : null,
        faceValue: voucher.faceValue,
        price: voucher.price,
      },
    });
  } catch (err) {
    console.error("❌ Voucher QR validate error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
