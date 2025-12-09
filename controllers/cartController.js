// controllers/cartController.js
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// 🧩 Helper: populate full product object exactly as Flutter expects
const populateCart = async (cart) => {
  if (!cart) return null;

  return await Cart.findById(cart._id).populate("items.productId");
};

// 🧮 Compute total from populated cart
const computeTotal = (cart) => {
  return cart.items.reduce((sum, i) => {
    const price = i.productId?.newPrice || 0;
    return sum + price * i.quantity;
  }, 0);
};

// =======================================================
// 📦 GET CART (by user OR session)
// =======================================================
export const getCart = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else
      return res.status(400).json({
        success: false,
        message: "Missing identifiers",
      });

    let cart = await Cart.findOne(query);
    if (!cart) cart = await Cart.create({ ...query, items: [] });

    const populated = await populateCart(cart);
    const total = computeTotal(populated);

    res.json({ success: true, cart: { ...populated.toObject(), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================
// 🧾 Checkout Preview (same format as CartProvider expects)
// =======================================================
export const checkoutPreview = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const items = cart.items.map((i) => ({
      productId: i.productId, // full product object
      quantity: i.quantity,
    }));

    const total = computeTotal(cart);

    res.json({
      success: true,
      preview: {
        items,
        total,
        itemCount: items.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================
// ➕ ADD TO CART (+/- quantity)
// =======================================================
export const addToCart = async (req, res) => {
  try {
    const { sessionId, userId, productId, quantity } = req.body;

    if (!productId)
      return res.status(400).json({ success: false, message: "Product ID required" });

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else return res.status(400).json({ success: false, message: "Missing identifiers" });

    let cart = await Cart.findOne(query);
    if (!cart) cart = await Cart.create({ ...query, items: [] });

    const existingItem = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;

      if (existingItem.quantity <= 0) {
        cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
      }
    } else {
      if (quantity > 0) {
        cart.items.push({ productId, quantity });
      } else {
        return res.status(400).json({
          success: false,
          message: "Cannot add negative quantity",
        });
      }
    }

    await cart.save();

    const populated = await populateCart(cart);
    const total = computeTotal(populated);

    res.json({
      success: true,
      cart: { ...populated.toObject(), total },
    });
  } catch (err) {
    console.error("❌ addToCart error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// =======================================================
// 🔄 Update quantity directly
// =======================================================
export const updateCartQty = async (req, res) => {
  try {
    const { sessionId, userId, productId, quantity } = req.body;

    if (!productId || typeof quantity !== "number")
      return res.status(400).json({
        success: false,
        message: "productId and numeric quantity required",
      });

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else return res.status(400).json({ success: false, message: "Missing identifiers" });

    let cart = await Cart.findOne(query);
    if (!cart)
      return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (!item)
      return res.status(404).json({ success: false, message: "Item not in cart" });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    const populated = await populateCart(cart);
    const total = computeTotal(populated);

    res.json({ success: true, cart: { ...populated.toObject(), total } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// =======================================================
// ➖ Remove item
// =======================================================
export const removeFromCart = async (req, res) => {
  try {
    const { sessionId, userId, productId } = req.body;

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else return res.status(400).json({ success: false, message: "Missing identifiers" });

    const cart = await Cart.findOne(query);
    if (!cart)
      return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();

    const populated = await populateCart(cart);
    const total = computeTotal(populated);

    res.json({ success: true, cart: { ...populated.toObject(), total } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// =======================================================
// 🧹 Clear cart
// =======================================================
export const clearCart = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    let query = {};
    if (userId) query.userId = userId;
    else if (sessionId) query.sessionId = sessionId;
    else return res.status(400).json({ success: false, message: "Missing identifiers" });

    await Cart.findOneAndUpdate(query, { items: [] });

    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// =======================================================
// 🔄 Merge guest → user cart
// =======================================================
export const mergeCarts = async (req, res) => {
  try {
    const { sessionId, userId } = req.body;

    if (!sessionId || !userId)
      return res.status(400).json({
        success: false,
        message: "Missing sessionId or userId",
      });

    const guestCart = await Cart.findOne({ sessionId });
    let userCart = await Cart.findOne({ userId });

    if (!guestCart || guestCart.items.length === 0) {
      if (!userCart) userCart = await Cart.create({ userId, items: [] });

      const populated = await populateCart(userCart);
      const total = computeTotal(populated);

      return res.json({
        success: true,
        message: "No guest cart found. Using existing user cart.",
        cart: { ...populated.toObject(), total },
      });
    }

    if (!userCart) {
      userCart = guestCart;
      userCart.userId = userId;
      userCart.sessionId = null;
      await userCart.save();

      const populated = await populateCart(userCart);
      const total = computeTotal(populated);

      return res.json({
        success: true,
        message: "Guest cart promoted to user cart.",
        cart: { ...populated.toObject(), total },
      });
    }

    // Merge items
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
    await Cart.deleteOne({ sessionId });

    const populated = await populateCart(userCart);
    const total = computeTotal(populated);

    res.json({
      success: true,
      message: "Cart merged successfully.",
      cart: { ...populated.toObject(), total },
    });
  } catch (err) {
    console.error("❌ mergeCarts error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
