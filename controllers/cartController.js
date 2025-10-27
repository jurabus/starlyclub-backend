// controllers/cartController.js
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// 🧩 Helper: normalize populated product details
const populateProducts = async (cart) => {
  if (!cart) return null;
  const fullCart = await Cart.findById(cart._id).populate("items.productId");
  return {
    _id: fullCart._id,
    userId: fullCart.userId,
    sessionId: fullCart.sessionId,
    items: fullCart.items.map((i) => ({
      _id: i.productId?._id,
      name: i.productId?.name,
      imageUrl: i.productId?.imageUrl,
      oldPrice: i.productId?.oldPrice,
      newPrice: i.productId?.newPrice,
      quantity: i.quantity,
    })),
  };
};

// 🧮 Helper: compute total
const computeTotal = (cart) => {
  return cart.items.reduce(
    (sum, i) =>
      sum +
      (i.productId?.newPrice ? i.productId.newPrice * i.quantity : 0),
    0
  );
};

// 📦 Get or create cart (by user or session)
export const getCart = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else
      return res
        .status(400)
        .json({ success: false, message: "Missing identifiers" });

    let cart = await Cart.findOne(query);
    if (!cart) cart = await Cart.create({ ...query, items: [] });

    const populated = await populateProducts(cart);
    const total = computeTotal(populated);
    res.json({ success: true, cart: { ...populated, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➕ Add product to cart
// ➕➖ Add or update product quantity in cart
export const addToCart = async (req, res) => {
  try {
    const { sessionId, userId, productId, quantity } = req.body;

    if (!productId)
      return res.status(400).json({ success: false, message: "Product ID required" });

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else
      return res.status(400).json({ success: false, message: "Missing identifiers" });

    // 🛒 Find or create cart
    let cart = await Cart.findOne(query);
    if (!cart) cart = await Cart.create({ ...query, items: [] });

    // 🧩 Locate existing product
    const existingItem = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (existingItem) {
      // 🔄 Adjust quantity (+/-)
      existingItem.quantity += quantity || 1;

      // 🚫 Remove if quantity ≤ 0
      if (existingItem.quantity <= 0) {
        cart.items = cart.items.filter(
          (i) => i.productId.toString() !== productId
        );
      }
    } else {
      // ➕ Add new product (if positive)
      if (quantity > 0) {
        cart.items.push({ productId, quantity });
      } else {
        return res.status(400).json({
          success: false,
          message: "Cannot add item with negative quantity",
        });
      }
    }

    await cart.save();

    const populated = await populateProducts(cart);
    const total = computeTotal(populated);

    res.json({ success: true, cart: { ...populated, total } });
  } catch (err) {
    console.error("❌ addToCart error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➖ Remove a product
export const removeFromCart = async (req, res) => {
  try {
    const { sessionId, userId, productId } = req.body;

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else
      return res
        .status(400)
        .json({ success: false, message: "Missing identifiers" });

    const cart = await Cart.findOne(query);
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();

    const populated = await populateProducts(cart);
    const total = computeTotal(populated);
    res.json({ success: true, cart: { ...populated, total } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🧹 Clear cart
export const clearCart = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else
      return res
        .status(400)
        .json({ success: false, message: "Missing identifiers" });

    await Cart.findOneAndUpdate(query, { items: [] });
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🔄 Merge guest cart into user cart on login
// 🔄 Merge guest cart into persistent user cart after login
export const mergeCarts = async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    if (!sessionId || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing sessionId or userId" });
    }

    // 🛒 Fetch both carts
    const guestCart = await Cart.findOne({ sessionId });
    let userCart = await Cart.findOne({ userId });

    // 🧩 If no guest cart → return user’s existing or new empty cart
    if (!guestCart || guestCart.items.length === 0) {
      if (!userCart) userCart = await Cart.create({ userId, items: [] });
      const populated = await populateProducts(userCart);
      const total = computeTotal(populated);
      return res.json({
        success: true,
        message: "No guest cart found. Using existing user cart.",
        cart: { ...populated, total },
      });
    }

    // 🧩 If user cart doesn't exist, promote guest → user
    if (!userCart) {
      userCart = guestCart;
      userCart.userId = userId;
      userCart.sessionId = null;
      await userCart.save();
      const populated = await populateProducts(userCart);
      const total = computeTotal(populated);
      return res.json({
        success: true,
        message: "Guest cart promoted to user cart.",
        cart: { ...populated, total },
      });
    }

    // 🧮 Merge guest items into existing user cart
    guestCart.items.forEach((guestItem) => {
      const match = userCart.items.find(
        (i) => i.productId.toString() === guestItem.productId.toString()
      );
      if (match) {
        match.quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    });

    await userCart.save();

    // 🧹 Clean up old guest cart
    await Cart.deleteOne({ sessionId });

    const populated = await populateProducts(userCart);
    const total = computeTotal(populated);
    return res.json({
      success: true,
      message: "Cart merged successfully.",
      cart: { ...populated, total },
    });
  } catch (err) {
    console.error("❌ mergeCarts error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

