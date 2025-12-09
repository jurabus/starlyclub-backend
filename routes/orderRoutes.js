// routes/orderRoutes.js
import express from "express";
import {
  checkout,
  getOrders,
  getOrderById,
  getProviderOrders,
  updateOrderStatus,
  userCancelOrder,
  getUserOrdersByStatus,
  providerIgnoreOrder,
  completeOrder,
  providerStats,
} from "../controllers/orderController.js";

const router = express.Router();

// 🧾 Checkout
router.post("/checkout", checkout);

// 🧾 User orders
router.get("/user/:userId", getOrders);
router.get("/user/:userId/status/:status", getUserOrdersByStatus);

// 🧾 User cancel
router.patch("/user/cancel/:orderId", userCancelOrder);

// 🧾 Order details
router.get("/:id", getOrderById);

// 🧾 Provider orders
router.get("/provider/:providerId", getProviderOrders);

// 🧾 Provider stats
router.get("/provider/:providerId/stats", providerStats);

// 🧾 Provider update status
router.patch("/:orderId/status", updateOrderStatus);

// 🧾 Provider ignore pending order
router.patch("/:orderId/ignore", providerIgnoreOrder);

// 🧾 Provider complete order
router.patch("/:orderId/complete", completeOrder);

export default router;
