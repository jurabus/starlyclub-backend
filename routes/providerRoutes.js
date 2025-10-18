import express from "express";
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  uploadProviderImage,
} from "../controllers/providerController.js";

const router = express.Router();

// GET all providers
router.get("/", getProviders);

// POST new provider (supports file upload)
router.post("/", uploadProviderImage, addProvider);

// PUT update provider (supports file upload)
router.put("/:id", uploadProviderImage, updateProvider);

// DELETE provider
router.delete("/:id", deleteProvider);

export default router;
