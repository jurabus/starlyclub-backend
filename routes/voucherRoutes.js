import express from "express";
import {
  createVoucher,
  listVouchers,
  getVoucher,
  updateVoucher,
  deleteVoucher,
  featuredVouchers,
  providerVouchers,
} from "../controllers/voucherController.js";

const router = express.Router();

// 🧾 General voucher routes
router.get("/", listVouchers);
router.get("/featured/list", featuredVouchers);

// 🎟️ Provider-specific vouchers
router.get("/provider/:id", providerVouchers);

// 📄 Single voucher + CRUD
router.get("/:id", getVoucher);

// ✅ Create new voucher
router.post("/", createVoucher);

// ✅ Update voucher (accept both PUT and PATCH for compatibility)
router.put("/:id", updateVoucher);
router.patch("/:id", updateVoucher);

// ✅ Delete voucher
router.delete("/:id", deleteVoucher);

export default router;
