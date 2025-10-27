// routes/orderRoutes.js
import express from "express";
import { checkout, getOrders, getOrderById } from "../controllers/orderController.js";

const router = express.Router();

router.post("/checkout", checkout); // 🧾 Convert cart -> order
router.get("/user/:userId", getOrders); // All orders of a user
router.get("/:id", getOrderById); // Single order

export default router;
