// controllers/orderController.js
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// 🧾 Checkout -> Create Order from Cart
export const checkout = async (req, res) => {
  try {
    const { sessionId, userId } = req.body;

    if (!sessionId && !userId)
      return res.status(400).json({ success: false, message: "Missing identifiers" });

    // 🛒 Find cart
    const cart = await Cart.findOne(userId ? { userId } : { sessionId }).populate(
      "items.productId"
    );

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ success: false, message: "Cart is empty" });

    // 🧮 Prepare order data
    const items = cart.items.map((i) => ({
      productId: i.productId._id,
      name: i.productId.name,
      imageUrl: i.productId.imageUrl,
      price: i.productId.newPrice,
      quantity: i.quantity,
    }));

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // 💾 Create order
    const order = await Order.create({
      userId,
      sessionId,
      items,
      total,
      status: "pending",
    });

    // 🧹 Clear cart after checkout
    await Cart.findOneAndUpdate(userId ? { userId } : { sessionId }, { items: [] });

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
