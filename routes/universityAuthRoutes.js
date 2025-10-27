import express from "express";
import {
  sendVerificationEmail,
  verifyEmailToken,
  completeProfile,
  login,
} from "../controllers/universityAuthController.js";

const router = express.Router();

router.post("/verify-email", sendVerificationEmail); 
router.get("/verify-token", verifyEmailToken);       
router.post("/complete-profile", completeProfile);
router.post("/login", login);   

export default router;
