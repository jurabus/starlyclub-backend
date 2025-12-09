// controllers/orderController.js
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

/* -----------------------------------------------------------------------------
   🧾 1) CHECKOUT — Create Order from Cart OR Direct Items
----------------------------------------------------------------------------- */
export const checkout = async (req, res) => {
  try {
    const { sessionId, userId, directItems } = req.body;

    if (!sessionId && !userId)
      return res
        .status(400)
        .json({ success: false, message: "Missing identifiers" });

    // 🔥 CASE 1 — Direct Buy (Voucher or Product)
    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      const total = directItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

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

    // 🔥 CASE 2 — Normal Cart Checkout
    const cart = await Cart.findOne(userId ? { userId } : { sessionId }).populate(
      "items.productId"
    );

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

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const providerId = cart.items[0].productId.providerId;

    const order = await Order.create({
      userId,
      sessionId,
      providerId,
      items,
      total,
      status: "pending",
    });

    // Clear cart after creating order
    await Cart.findOneAndUpdate(userId ? { userId } : { sessionId }, {
      items: [],
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -----------------------------------------------------------------------------
   2) USER — Get All Orders
----------------------------------------------------------------------------- */
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -----------------------------------------------------------------------------
   3) USER — Get Orders by Status (pending/completed/cancelled/all)
----------------------------------------------------------------------------- */
export const getUserOrdersByStatus = async (req, res) => {
  try {
    const { userId, status } = req.params;

    const query = { userId };
    if (status !== "all") query.status = status;

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -----------------------------------------------------------------------------
   4) USER — Cancel Order
----------------------------------------------------------------------------- */
export const userCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.userId?.toString() !== userId)
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (order.status !== "pending")
      return res.status(400).json({
        success: false,
        message: "Order can no longer be cancelled",
      });

    order.status = "cancelled";
    order.cancelReason = "Cancelled by user";

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -----------------------------------------------------------------------------
   5) ORDER DETAILS — Get One Order with Product Info
----------------------------------------------------------------------------- */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.productId"
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -----------------------------------------------------------------------------
   6) PROVIDER — Get Orders for Provider
----------------------------------------------------------------------------- */
export const getProviderOrders = async (req, res) => {
  try {
    const { providerId } = req.params;

    const orders = await Order.find({ providerId })
      .sort({ createdAt: -1 })
      .populate("items.productId");

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

/* -----------------------------------------------------------------------------
   7) PROVIDER — Update Order Status
----------------------------------------------------------------------------- */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

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

/* -----------------------------------------------------------------------------
   8) PROVIDER — Ignore Order
----------------------------------------------------------------------------- */
export const providerIgnoreOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "pending")
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be ignored",
      });

    order.status = "ignored";
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -----------------------------------------------------------------------------
   9) PROVIDER — Mark Order Completed
----------------------------------------------------------------------------- */
export const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "confirmed")
      return res.status(400).json({
        success: false,
        message: "Only confirmed orders can be completed",
      });

    order.status = "completed";
    order.completedAt = new Date();

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -----------------------------------------------------------------------------
   10) PROVIDER — Stats Dashboard
----------------------------------------------------------------------------- */
export const providerStats = async (req, res) => {
  try {
    const { providerId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      totalOrders: await Order.countDocuments({ providerId }),
      pending: await Order.countDocuments({ providerId, status: "pending" }),
      confirmed: await Order.countDocuments({
        providerId,
        status: "confirmed",
      }),
      cancelled: await Order.countDocuments({
        providerId,
        status: "cancelled",
      }),
      completed: await Order.countDocuments({
        providerId,
        status: "completed",
      }),
      revenueToday: (
        await Order.find({
          providerId,
          status: "completed",
          createdAt: { $gte: today },
        })
      ).reduce((sum, o) => sum + o.total, 0),
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
