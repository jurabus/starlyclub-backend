import express from "express";
import { listPayoutLogs } from "../controllers/adminPayoutController.js";

const router = express.Router();

// 🔐 protect with admin middleware if you have one
router.get("/payouts", listPayoutLogs);

export default router;
