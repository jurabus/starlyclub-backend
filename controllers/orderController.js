
// controllers/orderController.js
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// 🧾 Checkout -> Create Order from Cart
// 🧾 Create PICKUP Order
export const checkout = async (req, res) => {
  try {
    const { sessionId, userId, directItems } = req.body;

    if (!sessionId && !userId)
      return res
        .status(400)
        .json({ success: false, message: "Missing identifiers" });

    // 🟡 CASE 1: DIRECT PRODUCT CHECKOUT
    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      const total = directItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      // direct product always contains providerId passed from frontend
      const providerId = directItems[0].providerId;

      const order = await Order.create({
        userId,
        sessionId,
        providerId,
        items: directItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          imageUrl: i.imageUrl,
          price: i.price,
          quantity: i.quantity,
        })),
        total,
        status: "pending",
      });

      return res.json({ success: true, order });
    }

    // 🟢 CASE 2: NORMAL CART CHECKOUT
    const cart = await Cart.findOne(userId ? { userId } : { sessionId })
      .populate("items.productId");

    if (!cart || cart.items.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty" });

    const items = cart.items.map((i) => ({
      productId: i.productId._id,
      name: i.productId.name,
      imageUrl: i.productId.imageUrl,
      price: i.productId.newPrice,
      quantity: i.quantity,
    }));

    const total = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const providerId = cart.items[0].productId.providerId;

    const order = await Order.create({
      userId,
      sessionId,
      providerId,
      items,
      total,
      status: "pending",
    });

    // Clear backend cart after order
    await Cart.findOneAndUpdate(
      userId ? { userId } : { sessionId },
      { items: [] }
    );

    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// 🧾 Get all orders for a user
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🆕 For admin or user: get specific order details
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// 🧾 Provider: Get all orders for this provider
export const getProviderOrders = async (req, res) => {
  try {
    const { providerId } = req.params;

    const orders = await Order.find({ providerId })
      .sort({ createdAt: -1 })
      .populate("items.productId");

    // Auto mark expired
    const now = new Date();
    for (const order of orders) {
      if (order.status === "pending" && order.expiresAt < now) {
        order.status = "ignored";
        await order.save();
      }
    }

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// 🆕 Provider updates status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (order.status !== "pending")
      return res.status(400).json({
        success: false,
        message: "Order already processed",
      });

    if (status === "cancelled" && !reason)
      return res.status(400).json({
        success: false,
        message: "Reason required when cancelling",
      });

    order.status = status;
    if (status === "cancelled") order.cancelReason = reason;

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
