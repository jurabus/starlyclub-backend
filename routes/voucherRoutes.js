import express from "express";
import {
  purchaseVoucher,
  getUserVouchers,
  adminListVouchers,
  issueVoucherQR,
  validateVoucherQR,
  createVoucherPayment,
} from "../controllers/voucherController.js";

const router = express.Router();

// User actions
router.post("/purchase", purchaseVoucher);
router.post("/payment", createVoucherPayment);
router.get("/user/list", getUserVouchers);

// Admin action (VIEW ONLY — no editing)
router.get("/admin/list", adminListVouchers);

// QR logic
router.post("/qr/issue/:id", issueVoucherQR);
router.get("/qr/validate/:code", validateVoucherQR);

export default router;
