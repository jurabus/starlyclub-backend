// routes/providerAuthRoutes.js
import express from "express";
import { loginProvider } from "../controllers/providerAuthController.js";

const router = express.Router();

router.post("/login", loginProvider);

export default router;
