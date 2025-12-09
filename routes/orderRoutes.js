import express from "express";
import {
  checkout,
  getOrders,
  getOrderById,
  getProviderOrders,
  updateOrderStatus
} from "../controllers/orderController.js";

const router = express.Router();

// User checkout (pickup order)
router.post("/checkout", checkout);

// User orders
router.get("/user/:userId", getOrders);

// Provider orders
router.get("/provider/:providerId", getProviderOrders);

// Provider updates order status
router.patch("/:orderId/status", updateOrderStatus);

// Single order
router.get("/:id", getOrderById);

export default router;
