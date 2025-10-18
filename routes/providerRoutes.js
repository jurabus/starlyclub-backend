import express from "express";
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
} from "../controllers/providerController.js";

const router = express.Router();

// GET all providers
router.get("/", getProviders);

// POST new provider
router.post("/", addProvider);

// PUT update provider
router.put("/:id", updateProvider);

// DELETE provider
router.delete("/:id", deleteProvider);

export default router;
