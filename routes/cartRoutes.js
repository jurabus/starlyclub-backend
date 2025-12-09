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

// ======================================================
// GET CART BY USER ID
// ======================================================
router.get("/user/:userId", getCart);

// GET CART BY SESSION ID
router.get("/session/:sessionId", getCart);

// ======================================================
// CHECKOUT PREVIEW (only works for logged-in users)
// ======================================================
router.get("/user/:userId/preview", checkoutPreview);

// ======================================================
// ADD ITEM TO CART (user or session)
// ======================================================
router.post("/", addToCart);

// ======================================================
// MERGE CARTS (guest → user)
// ======================================================
router.post("/merge", mergeCarts);

// ======================================================
// UPDATE QUANTITY (user or session)
// ======================================================
router.put("/qty", updateCartQty);

// ======================================================
// CLEAR CART (by user or session)
// ======================================================
router.delete("/user/:userId", clearCart);
router.delete("/session/:sessionId", clearCart);

export default router;
