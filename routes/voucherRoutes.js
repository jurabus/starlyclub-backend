// routes/voucherRoutes.js
import express from "express";
import {
  createVoucher,
  listVouchers,
  getVoucher,
  updateVoucher,
  deleteVoucher,
  featuredVouchers,
} from "../controllers/voucherController.js";

const router = express.Router();

router.get("/", listVouchers);
router.get("/featured/list", featuredVouchers);
router.get("/:id", getVoucher);
router.post("/", createVoucher);
router.patch("/:id", updateVoucher);
router.delete("/:id", deleteVoucher);

export default router;
