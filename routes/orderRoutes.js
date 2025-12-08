import express from "express";
import {
  checkout,
  getOrders,
  getOrderById
} from "../controllers/orderController.js";

const router = express.Router();

// 🧾 Create order from cart
router.post("/checkout", checkout);

// 📦 Get all orders for a user
router.get("/user/:userId", getOrders);

// 🔍 Get single order by id
router.get("/:id", getOrderById);

export default router;
