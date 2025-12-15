import express from "express";
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderById,
  startTapOnboarding,
  startTabbyOnboarding,
  startTamaraOnboarding,
  getProviderEarnings,
  
} from "../controllers/providerController.js";

const router = express.Router();
// GET provider by ID
router.get("/:id", getProviderById);
// GET all providers
router.get("/", getProviders);

// POST new provider (supports file upload) router.post("/", uploadProviderImage, addProvider);
router.post("/" , createProvider);  
router.get("/:providerId/earnings", getProviderEarnings);

router.post("/tap/onboard", startTapOnboarding);
router.post("/tabby/onboard", startTabbyOnboarding);
router.post("/tamara/onboard", startTamaraOnboarding);

// PUT update provider (supports file upload)
router.put("/:id", updateProvider);

// DELETE provider
router.delete("/:id", deleteProvider);

export default router;