import express from "express";
import { signupProvider, loginProvider } from "../controllers/providerAuthController.js";

const router = express.Router();

router.post("/signup", signupProvider);
router.post("/login", loginProvider);

export default router;
