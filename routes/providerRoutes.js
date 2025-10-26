import express from "express";
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  getProviderById,
  
} from "../controllers/providerController.js";

const router = express.Router();
// GET provider by ID
router.get("/:id", getProviderById);
// GET all providers
router.get("/", getProviders);

// POST new provider (supports file upload) router.post("/", uploadProviderImage, addProvider);
router.post("/" , addProvider);  

// PUT update provider (supports file upload)
router.put("/:id", updateProvider);

// DELETE provider
router.delete("/:id", deleteProvider);

export default router;
