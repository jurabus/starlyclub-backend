import express from "express";
import Offer from "../models/Offer.js";
import crypto from "crypto";

const router = express.Router();

/**
 * 🔹 Issue a short-lived QR code (valid for 10 seconds)
 * POST /api/qr/issue/:offerId
 */
router.post("/issue/:offerId", async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found." });

    // Generate unique code valid for 10 seconds
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 1000); // 10 seconds

    offer.currentQrCode = code;
    offer.qrExpiresAt = expiresAt;
    offer.isRedeemed = false;
    await offer.save();

    const validationUrl = `${req.protocol}://${req.get("host")}/api/qr/validate/${code}`;

    res.json({
      success: true,
      message: "QR issued successfully.",
      code,
      expiresAt,
      validationUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 🔹 Validate a QR code
 * GET /api/qr/validate/:code
 */
router.get("/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const offer = await Offer.findOne({ currentQrCode: code }).populate("providerId");

    if (!offer)
      return res.status(404).json({ success: false, message: "❌ Invalid QR code." });

    // Check expiration
    if (offer.qrExpiresAt && new Date() > offer.qrExpiresAt) {
      return res.status(410).json({ success: false, message: "⏰ QR code expired." });
    }

    // Check if already redeemed
    if (offer.isRedeemed) {
      return res.status(409).json({ success: false, message: "🚫 Offer already redeemed." });
    }

    // Mark as redeemed immediately
    offer.isRedeemed = true;
    await offer.save();

    res.json({
      success: true,
      message: "✅ Offer validated successfully.",
      offer: {
        id: offer._id,
        name: offer.name,
        provider: offer.providerId?.name,
        discount: offer.discountPercent,
        description: offer.description,
        imageUrl: offer.imageUrl
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
