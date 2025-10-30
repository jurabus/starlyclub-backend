// routes/voucherRoutes.js
import express from "express";
import {
  createVoucher,
  listVouchers,
  getVoucher,
  updateVoucher,
  deleteVoucher,
  featuredVouchers,
  providerVouchers, // ✅ added
} from "../controllers/voucherController.js";

const router = express.Router();

// 🧾 General voucher routes
router.get("/", listVouchers);
router.get("/featured/list", featuredVouchers);

// 🎟️ Provider-specific vouchers
router.get("/provider/:id", providerVouchers); // ✅ new route

// 📄 Single voucher + CRUD
router.get("/:id", getVoucher);
router.post("/", createVoucher);
router.patch("/:id", updateVoucher);
router.delete("/:id", deleteVoucher);

export default router;
