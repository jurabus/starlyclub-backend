import express from "express";
import PaymentIntent from "../models/PaymentIntent.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";


const router = express.Router();

router.post("/tap", async (req, res) => {
  try {
    const { metadata, status } = req.body;
    if (!metadata?.paymentIntentId) return res.sendStatus(200);

    const intent = await PaymentIntent.findById(metadata.paymentIntentId);
    if (!intent || intent.status === "paid") return res.sendStatus(200);
if (intent.gateway !== "tap") return res.sendStatus(200);

    if (status !== "CAPTURED") {
      intent.status = "failed";
      await intent.save();
      return res.sendStatus(200);
    }

    intent.status = "paid";
    await intent.save();

    // 🔥 CREATE ORDER (reuse checkout logic safely)
    const cart = await Cart.findOne(
      intent.userId
        ? { userId: intent.userId }
        : { sessionId: intent.sessionId }
    ).populate("items.productId");

    if (!cart || cart.items.length === 0) return res.sendStatus(200);

    const items = cart.items.map((i) => ({
      productId: i.productId._id,
      name: i.productId.name,
      imageUrl: i.productId.imageUrl,
      price: i.productId.newPrice,
      quantity: i.quantity,
    }));

    const order = await Order.create({
      userId: intent.userId,
      sessionId: intent.sessionId,
      providerId: intent.providerId,
      items,
      total: intent.amount,
	  payment: {
  gateway: intent.gateway,
  paymentIntentId: intent._id,
  paidAt: new Date(),
},

      status: "pending",
    });

    await Cart.findOneAndUpdate(
      intent.userId
        ? { userId: intent.userId }
        : { sessionId: intent.sessionId },
      { items: [] }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(200);
  }
});

router.post("/tabby", async (req, res) => {
  try {
    const event = req.body;

    if (event.status !== "authorized" && event.status !== "captured") {
      return res.sendStatus(200);
    }

    const intentId = event.reference_id;
    if (!intentId) return res.sendStatus(200);

    const intent = await PaymentIntent.findById(intentId);
    if (!intent || intent.status === "paid") return res.sendStatus(200);

    intent.status = "paid";
    await intent.save();

    const cart = await Cart.findOne(
      intent.userId
        ? { userId: intent.userId }
        : { sessionId: intent.sessionId }
    ).populate("items.productId");

    if (!cart || cart.items.length === 0) return res.sendStatus(200);

    const items = cart.items.map((i) => ({
      productId: i.productId._id,
      name: i.productId.name,
      imageUrl: i.productId.imageUrl,
      price: i.productId.newPrice,
      quantity: i.quantity,
    }));

    await Order.create({
      userId: intent.userId,
      sessionId: intent.sessionId,
      providerId: intent.providerId,
      items,
      total: intent.amount,
      payment: {
        gateway: "tabby",
        paymentIntentId: intent._id,
        paidAt: new Date(),
      },
      status: "pending",
    });

    await Cart.findOneAndUpdate(
      intent.userId
        ? { userId: intent.userId }
        : { sessionId: intent.sessionId },
      { items: [] }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("Tabby webhook error:", err);
    res.sendStatus(200);
  }
});

router.post("/tamara", async (req, res) => {
  try {
    const event = req.body;

    if (!["order_approved", "order_captured"].includes(event.event_type)) {
      return res.sendStatus(200);
    }

    const intentId = event.order_reference_id;
    if (!intentId) return res.sendStatus(200);

    const intent = await PaymentIntent.findById(intentId);
    if (!intent || intent.status === "paid") return res.sendStatus(200);

    intent.status = "paid";
    await intent.save();

    const cart = await Cart.findOne(
      intent.userId
        ? { userId: intent.userId }
        : { sessionId: intent.sessionId }
    ).populate("items.productId");

    if (!cart || cart.items.length === 0) return res.sendStatus(200);

    const items = cart.items.map((i) => ({
      productId: i.productId._id,
      name: i.productId.name,
      imageUrl: i.productId.imageUrl,
      price: i.productId.newPrice,
      quantity: i.quantity,
    }));

    await Order.create({
      userId: intent.userId,
      sessionId: intent.sessionId,
      providerId: intent.providerId,
      items,
      total: intent.amount,
      payment: {
        gateway: "tamara",
        paymentIntentId: intent._id,
        paidAt: new Date(),
      },
      status: "pending",
    });

    await Cart.findOneAndUpdate(
      intent.userId
        ? { userId: intent.userId }
        : { sessionId: intent.sessionId },
      { items: [] }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("Tamara webhook error:", err);
    res.sendStatus(200);
  }
});




export default router;
