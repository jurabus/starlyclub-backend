import express from "express";
import {
  createProvider, getProviders, getProvider, updateProvider, deleteProvider
} from "../controllers/providerController.js";
const router = express.Router();

router.post("/", createProvider);
router.get("/", getProviders);
router.get("/:id", getProvider);
router.put("/:id", updateProvider);
router.delete("/:id", deleteProvider);

export default router;
