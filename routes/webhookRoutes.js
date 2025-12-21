import express from "express";
import PaymentIntent from "../models/PaymentIntent.js";
import { finalizePaymentOnce } from "../utils/paymentFinalizer.js";

const router = express.Router();

/* ================= TAP ================= */
router.post("/tap", async (req, res) => {
  try {
    const { metadata, status } = req.body;
    if (!metadata?.paymentIntentId) return res.sendStatus(200);

    const intent = await PaymentIntent.findById(metadata.paymentIntentId);
    if (!intent || intent.gateway !== "tap") return res.sendStatus(200);

    if (status !== "CAPTURED") {
      await PaymentIntent.findByIdAndUpdate(intent._id, { status: "failed" });
      return res.sendStatus(200);
    }

    await finalizePaymentOnce(intent);
    return res.sendStatus(200);
  } catch (err) {
    console.error("Tap webhook error:", err);
    return res.sendStatus(200);
  }
});

/* ================= TABBY ================= */
router.post("/tabby", async (req, res) => {
  try {
    const intentId = req.body.reference_id;
    if (!intentId) return res.sendStatus(200);

    const intent = await PaymentIntent.findById(intentId);
    if (!intent || intent.gateway !== "tabby") return res.sendStatus(200);

    await finalizePaymentOnce(intent);
    return res.sendStatus(200);
  } catch (err) {
    console.error("Tabby webhook error:", err);
    return res.sendStatus(200);
  }
});

/* ================= TAMARA ================= */
router.post("/tamara", async (req, res) => {
  try {
    if (!["order_approved", "order_captured"].includes(req.body.event_type))
      return res.sendStatus(200);

    const intentId = req.body.order_reference_id;
    if (!intentId) return res.sendStatus(200);

    const intent = await PaymentIntent.findById(intentId);
    if (!intent || intent.gateway !== "tamara") return res.sendStatus(200);

    await finalizePaymentOnce(intent);
    return res.sendStatus(200);
  } catch (err) {
    console.error("Tamara webhook error:", err);
    return res.sendStatus(200);
  }
});

export default router;
