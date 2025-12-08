import express from "express";
import {
  sendVerificationEmail,
  verifyEmailToken,
  completeProfile,
  login,
  quickVerifyLogin,
} from "../controllers/universityAuthController.js";

const router = express.Router();

router.post("/verify-email", sendVerificationEmail); 
router.post("/quick-verify-login", quickVerifyLogin);

router.get("/verify-token", verifyEmailToken);       
router.post("/complete-profile", completeProfile);
router.post("/login", login);   

export default router;
