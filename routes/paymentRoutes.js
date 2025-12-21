import express from "express";
import { initiatePayment } from "../controllers/paymentController.js";

const router = express.Router();

/**
 * Unified payment initiation
 * method: card | apple_pay | wallet | fawry
 */
router.post("/initiate", initiatePayment);

export default router;
