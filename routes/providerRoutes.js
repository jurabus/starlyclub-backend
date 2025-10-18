import express from "express";
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
} from "../controllers/providerController.js";

const router = express.Router();

router.get("/", getProviders);
router.post("/", addProvider);
router.put("/:id", updateProvider);
router.delete("/:id", deleteProvider);

export default router;
