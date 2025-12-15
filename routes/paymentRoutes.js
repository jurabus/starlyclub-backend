import express from "express";
import { createTapPayment, createTabbyPayment, createTamaraPayment } from "../controllers/paymentController.js";

const router = express.Router();
router.post("/tap/create", createTapPayment);
router.post("/tabby/create", createTabbyPayment);
router.post("/tamara/create", createTamaraPayment);
export default router;
