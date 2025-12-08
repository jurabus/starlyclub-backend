import express from "express";
import {
  getCart,
  addToCart,
  updateCartQty,
  clearCart,
  mergeCarts,
  checkoutPreview,
} from "../controllers/cartController.js";

const router = express.Router();

// Get cart (user or session)
router.get("/:userId", getCart);

// Checkout preview
router.get("/:userId/preview", checkoutPreview);

// Add item to cart
router.post("/", addToCart);

// Merge guest cart into user cart
router.post("/merge", mergeCarts);

// Update quantity
router.put("/qty", updateCartQty);

// Clear cart
router.delete("/:userId", clearCart);

export default router;
