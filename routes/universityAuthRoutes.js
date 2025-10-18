import express from "express";
import {
  sendVerificationEmail,
  verifyEmailToken,
  completeProfile,
} from "../controllers/universityAuthController.js";

const router = express.Router();

router.post("/verify-email", sendVerificationEmail); // Step 1
router.get("/verify-token", verifyEmailToken);       // Step 2
router.post("/complete-profile", completeProfile);   // Step 3

export default router;
