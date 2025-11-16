import express from "express";
import Offer from "../models/Offer.js";
import crypto from "crypto";
import { issueVoucherQR, validateVoucherQR } from "../controllers/voucherController.js";
const router = express.Router();



router.post("/voucher/issue/:voucherId", issueVoucherQR);
router.get("/voucher/validate/:code", validateVoucherQR);

/**
 * POST /api/qr/issue/:offerId
 * Issue short-lived QR (90s TTL)
 */
router.post("/issue/:offerId", async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found." });

    // 🔹 Give users time to scan — 90 seconds
    const TTL_SECONDS = 90;

    const code = crypto.randomBytes(4).toString("hex").toUpperCase().trim();
    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);

    offer.currentQrCode = code;
    offer.qrExpiresAt = expiresAt;
    offer.isRedeemed = false;
    await offer.save();

    // ✅ Ensure correct protocol (Render reverse-proxy fix)
    const proto =
      (req.headers["x-forwarded-proto"] || "").split(",")[0] || req.protocol || "https";
    const host = req.get("host");
    const validationUrl = `${proto}://${host}/api/qr/validate/${encodeURIComponent(code)}`;

    res.json({
      success: true,
      message: "QR issued successfully.",
      code,
      expiresAt,
      validationUrl,
    });
  } catch (err) {
    console.error("❌ QR issue error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/qr/validate/:code
 * Validate and redeem atomically
 */
router.get("/validate/:code", async (req, res) => {
  try {
    const raw = (req.params.code || "").trim().toUpperCase();
    if (!raw) return res.status(400).json({ success: false, message: "Missing code." });

    const now = new Date();

    // 🔹 Atomic lookup + redeem
    const offer = await Offer.findOneAndUpdate(
      {
        currentQrCode: raw,
        isRedeemed: false,
        $or: [{ qrExpiresAt: { $exists: false } }, { qrExpiresAt: { $gt: now } }],
      },
      { $set: { isRedeemed: true } },
      { new: true }
    ).populate("providerId");

    if (!offer) {
      const found = await Offer.findOne({ currentQrCode: raw }).select("qrExpiresAt isRedeemed");
      if (!found)
        return res.status(404).json({ success: false, message: "❌ Invalid QR code." });
      if (found.isRedeemed)
        return res.status(409).json({ success: false, message: "🚫 Offer already redeemed." });
      if (found.qrExpiresAt && now > found.qrExpiresAt)
        return res.status(410).json({ success: false, message: "⏰ QR code expired." });
      return res.status(400).json({ success: false, message: "Cannot validate QR." });
    }

    res.json({
      success: true,
      message: "✅ Offer validated successfully.",
      offer: {
        id: offer._id,
        name: offer.name,
        category: offer.category,
        description: offer.description,
        imageUrl: offer.imageUrl,
        discountPercent: offer.discountPercent,
        providerId: offer.providerId
          ? {
              id: offer.providerId._id,
              name: offer.providerId.name,
              logoUrl: offer.providerId.logoUrl,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("❌ QR validate error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
