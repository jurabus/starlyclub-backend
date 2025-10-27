// routes/cartRoutes.js
import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  mergeCarts,
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/:sessionId", getCart);
router.get("/user/:userId", getCart);

router.post("/add", addToCart);
router.post("/remove", removeFromCart);
router.delete("/clear/:sessionId", clearCart);
router.delete("/clear/user/:userId", clearCart);

// Merge guest → user
router.post("/merge", mergeCarts);
export default router;
